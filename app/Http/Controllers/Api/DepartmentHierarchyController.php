<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\User;
use App\Services\DepartmentHierarchyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Exception;

class DepartmentHierarchyController extends Controller
{
    protected DepartmentHierarchyService $hierarchyService;

    public function __construct(DepartmentHierarchyService $hierarchyService)
    {
        $this->hierarchyService = $hierarchyService;
    }

    /**
     * Get department hierarchy tree with caching
     */
    public function tree(): JsonResponse
    {
        try {
            $userId = Auth::user()?->id ?? 0;
            $cacheKey = 'department_hierarchy_tree_' . $userId;
            
            $tree = cache()->remember($cacheKey, now()->addDay(), function () {
                $data = $this->hierarchyService->buildTree();
                return $data;
            });

            return response()->json([
                'success' => true,
                'data' => $tree,
                'cached' => true,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Get hierarchy path for department
     */
    public function path(int $departmentId): JsonResponse
    {
        try {
            $path = $this->hierarchyService->getHierarchyPath($departmentId);
            $breadcrumb = is_array($path) ? array_column($path, 'name') : $path->pluck('name')->toArray();

            return response()->json([
                'success' => true,
                'data' => $path,
                'breadcrumb' => $breadcrumb,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Get department descendants (children)
     */
    public function descendants(int $departmentId, Request $request): JsonResponse
    {
        try {
            $includeSelf = $request->boolean('include_self', false);
            $department = Department::findOrFail($departmentId);

            $descendants = $this->hierarchyService->getDescendants($department, $includeSelf);

            return response()->json([
                'success' => true,
                'data' => $descendants->load('users')->toArray(),
                'count' => $descendants->count(),
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Get department ancestors (parents)
     */
    public function ancestors(int $departmentId, Request $request): JsonResponse
    {
        try {
            $includeSelf = $request->boolean('include_self', false);
            $department = Department::findOrFail($departmentId);

            $ancestors = $this->hierarchyService->getAncestors($department, $includeSelf);

            return response()->json([
                'success' => true,
                'data' => $ancestors->toArray(),
                'count' => $ancestors->count(),
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Get user's reporting structure
     */
    public function reportingStructure(int $userId): JsonResponse
    {
        try {
            $structure = $this->hierarchyService->getReportingStructure($userId);

            return response()->json([
                'success' => true,
                'data' => $structure,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Get user's direct manager
     */
    public function manager(int $userId): JsonResponse
    {
        try {
            $manager = $this->hierarchyService->getDirectManager($userId);

            return response()->json([
                'success' => true,
                'data' => $manager,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Get user's subordinates
     */
    public function subordinates(int $userId): JsonResponse
    {
        try {
            $subordinates = $this->hierarchyService->getSubordinates($userId);

            return response()->json([
                'success' => true,
                'data' => $subordinates->load('department')->toArray(),
                'count' => $subordinates->count(),
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Get department breadcrumb path
     */
    public function breadcrumb(int $departmentId): JsonResponse
    {
        try {
            $breadcrumb = $this->hierarchyService->getBreadcrumb($departmentId);

            return response()->json([
                'success' => true,
                'data' => $breadcrumb,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Move department to new parent
     */
    public function moveDepartment(Request $request, int $departmentId): JsonResponse
    {
        try {
            $validated = $request->validate([
                'parent_id' => 'nullable|integer|exists:departments,id',
            ]);

            $department = Department::findOrFail($departmentId);

            $this->hierarchyService->moveDepartment(
                $department,
                $validated['parent_id']
            );

            return response()->json([
                'success' => true,
                'message' => 'Department moved successfully',
                'data' => $department->fresh()->load('parent'),
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get department level
     */
    public function level(int $departmentId): JsonResponse
    {
        try {
            $level = $this->hierarchyService->getLevel($departmentId);

            return response()->json([
                'success' => true,
                'data' => [
                    'department_id' => $departmentId,
                    'level' => $level,
                    'description' => $level === 0 ? 'Root' : "Level $level",
                ],
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
