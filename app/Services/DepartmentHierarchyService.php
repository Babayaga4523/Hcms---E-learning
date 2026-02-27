<?php

namespace App\Services;

use App\Models\Department;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\Collection;
use Exception;

/**
 * DepartmentHierarchyService
 * Manages department hierarchy and tree structures
 */
class DepartmentHierarchyService
{
    /**
     * Maximum depth for recursive operations
     */
    private const MAX_DEPTH = 50;

    /**
     * Build hierarchical tree from departments
     */
    public function buildTree(): array
    {
        $departments = Department::with('parent', 'children')->get();
        $tree = [];

        // Get root departments (no parent)
        $roots = $departments->where('parent_id', null);

        foreach ($roots as $root) {
            $tree[] = $this->buildBranch($root, $departments);
        }

        return $tree;
    }

    /**
     * Build a single branch of the tree with depth limit to prevent infinite loops
     */
    private function buildBranch(Department $department, Collection $allDepartments, int $currentDepth = 0): array
    {
        // Stop recursion if max depth reached
        if ($currentDepth >= self::MAX_DEPTH) {
            return [
                'id' => $department->id,
                'name' => $department->name,
                'parent_id' => $department->parent_id,
                'level' => $this->getLevel($department->id),
                'head_id' => $department->head_id,
                'users_count' => $department->users()->count(),
                'children' => [],
                '_depth_limit_reached' => true,
            ];
        }

        return [
            'id' => $department->id,
            'name' => $department->name,
            'parent_id' => $department->parent_id,
            'level' => $this->getLevel($department->id),
            'head_id' => $department->head_id,
            'users_count' => $department->users()->count(),
            'children' => $department->children->map(fn($child) => $this->buildBranch($child, $allDepartments, $currentDepth + 1))->toArray(),
        ];
    }

    /**
     * Get department hierarchy level
     */
    public function getLevel(int $departmentId): int
    {
        $department = Department::find($departmentId);
        if (!$department) {
            return 0;
        }

        $level = 0;
        while ($department->parent_id) {
            $level++;
            $department = $department->parent;
        }

        return $level;
    }

    /**
     * Get hierarchy path for a department
     */
    public function getHierarchyPath(int $departmentId): array
    {
        $path = [];
        $department = Department::find($departmentId);

        while ($department) {
            array_unshift($path, [
                'id' => $department->id,
                'name' => $department->name,
            ]);
            $department = $department->parent;
        }

        return $path;
    }

    /**
     * Get all descendants of a department with depth limit
     */
    public function getDescendants(Department $department, bool $includeSelf = false, int $currentDepth = 0): Collection
    {
        // Stop recursion if max depth reached
        if ($currentDepth >= self::MAX_DEPTH) {
            return collect();
        }

        $descendants = collect();

        if ($includeSelf) {
            $descendants->push($department);
        }

        foreach ($department->children as $child) {
            $descendants = $descendants->merge($this->getDescendants($child, true, $currentDepth + 1));
        }

        return $descendants;
    }

    /**
     * Get all ancestors of a department
     */
    public function getAncestors(Department $department, bool $includeSelf = false): Collection
    {
        $ancestors = collect();

        if ($includeSelf) {
            $ancestors->push($department);
        }

        $current = $department;
        while ($current->parent) {
            $ancestors->push($current->parent);
            $current = $current->parent;
        }

        return $ancestors;
    }

    /**
     * Move department to new parent
     */
    public function moveDepartment(Department $department, ?int $newParentId): void
    {
        DB::beginTransaction();
        try {
            // Validation 1: Cannot be parent of itself
            if ($newParentId === $department->id) {
                throw new Exception("Department cannot be parent of itself");
            }

            // Validation 2: Cannot create circular hierarchy
            if ($newParentId) {
                $newParent = Department::find($newParentId);
                if (!$newParent) {
                    throw new Exception("New parent department not found");
                }

                // Check if new parent is a descendant of current department
                $descendants = $this->getDescendants($department, true)->pluck('id');
                if ($descendants->contains($newParentId)) {
                    throw new Exception("Cannot move department to its own descendant");
                }
            }

            // Update parent
            $department->update(['parent_id' => $newParentId]);

            // Recalculate levels for all descendants
            $this->recalculateLevels($department);

            DB::commit();
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Recalculate hierarchy levels for department and descendants with depth limit
     */
    private function recalculateLevels(Department $department, int $level = 0, int $currentDepth = 0): void
    {
        // Stop recursion if max depth reached
        if ($currentDepth >= self::MAX_DEPTH) {
            return;
        }

        $department->update(['level' => $level]);

        foreach ($department->children as $child) {
            $this->recalculateLevels($child, $level + 1, $currentDepth + 1);
        }
    }

    /**
     * Get manager of a user based on department hierarchy
     */
    public function getDirectManager(int $userId)
    {
        $user = \App\Models\User::find($userId);
        if (!$user || !$user->department_id) {
            return null;
        }

        // Get the department head
        $department = $user->department;
        if ($department->head_id && $department->head_id !== $user->id) {
            return $department->head;
        }

        // If user is department head, get parent department head
        if ($department->parent_id) {
            $parentDept = $department->parent;
            return $parentDept->head;
        }

        return null;
    }

    /**
     * Get all subordinates of a user
     */
    public function getSubordinates(int $userId): Collection
    {
        $user = \App\Models\User::find($userId);
        if (!$user || !$user->department_id) {
            return collect();
        }

        // Get all departments under this user's department
        $department = $user->department;
        $subordinateDepts = $this->getDescendants($department, true);

        return \App\Models\User::whereIn('department_id', $subordinateDepts->pluck('id'))
            ->where('id', '!=', $userId)
            ->get();
    }

    /**
     * Get reporting structure for an employee
     */
    public function getReportingStructure(int $userId): array
    {
        $user = \App\Models\User::find($userId);
        if (!$user) {
            return [];
        }

        $structure = [
            'employee' => [
                'id' => $user->id,
                'name' => $user->name,
                'department' => $user->department?->name,
            ],
            'manager' => null,
            'department_head' => null,
            'executives' => [],
        ];

        // Get direct manager
        $manager = $this->getDirectManager($user->id);
        if ($manager) {
            $structure['manager'] = [
                'id' => $manager->id,
                'name' => $manager->name,
            ];
        }

        // Get department head
        if ($user->department) {
            $head = $user->department->head;
            if ($head) {
                $structure['department_head'] = [
                    'id' => $head->id,
                    'name' => $head->name,
                ];
            }

            // Get executive chain
            $current = $user->department;
            while ($current->parent) {
                $current = $current->parent;
                if ($current->head) {
                    $structure['executives'][] = [
                        'id' => $current->head->id,
                        'name' => $current->head->name,
                        'level' => $current->name,
                    ];
                }
            }
        }

        return $structure;
    }

    /**
     * Validate department compatibility for role assignment
     */
    public function validateDepartmentForRole(Department $department, string $roleId): bool
    {
        // Check if role is restricted to specific departments
        $allowedDepts = DB::table('role_department_compatibility')
            ->where('role_id', $roleId)
            ->where('is_restricted', true)
            ->pluck('allowed_department_id');

        if ($allowedDepts->isEmpty()) {
            return true; // No restrictions
        }

        return $allowedDepts->contains($department->id);
    }

    /**
     * Get breadcrumb path for UI
     */
    public function getBreadcrumb(int $departmentId): array
    {
        $path = $this->getHierarchyPath($departmentId);
        return array_map(fn($item) => $item['name'], $path);
    }
}
