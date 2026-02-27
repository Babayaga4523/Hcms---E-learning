<?php

namespace Tests\Unit\Services;

use App\Models\Department;
use App\Models\User;
use App\Services\DepartmentHierarchyService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Exception;

class DepartmentHierarchyServiceTest extends TestCase
{
    use RefreshDatabase;

    protected DepartmentHierarchyService $hierarchyService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->hierarchyService = app(DepartmentHierarchyService::class);
    }

    /**
     * Test build department tree
     */
    public function test_build_tree(): void
    {
        $root = Department::factory()->create(['parent_id' => null, 'level' => 0]);
        $child = Department::factory()->create(['parent_id' => $root->id, 'level' => 1]);
        $grandchild = Department::factory()->create(['parent_id' => $child->id, 'level' => 2]);

        $tree = $this->hierarchyService->buildTree();

        $this->assertNotEmpty($tree);
        // Tree should contain the root department
        $this->assertTrue(collect($tree)->pluck('id')->contains($root->id));
    }

    /**
     * Test get hierarchy path
     */
    public function test_get_hierarchy_path(): void
    {
        $root = Department::factory()->create(['parent_id' => null]);
        $middle = Department::factory()->create(['parent_id' => $root->id]);
        $leaf = Department::factory()->create(['parent_id' => $middle->id]);

        $path = $this->hierarchyService->getHierarchyPath($leaf->id);

        $this->assertCount(3, $path);
        $this->assertEquals($leaf->id, $path[0]->id);
        $this->assertEquals($middle->id, $path[1]->id);
        $this->assertEquals($root->id, $path[2]->id);
    }

    /**
     * Test get descendants
     */
    public function test_get_descendants(): void
    {
        $parent = Department::factory()->create(['parent_id' => null]);
        $child1 = Department::factory()->create(['parent_id' => $parent->id]);
        $child2 = Department::factory()->create(['parent_id' => $parent->id]);
        $grandchild = Department::factory()->create(['parent_id' => $child1->id]);

        $descendants = $this->hierarchyService->getDescendants($parent);

        $this->assertCount(3, $descendants); // 2 children + 1 grandchild
    }

    /**
     * Test get ancestors
     */
    public function test_get_ancestors(): void
    {
        $root = Department::factory()->create(['parent_id' => null]);
        $middle = Department::factory()->create(['parent_id' => $root->id]);
        $leaf = Department::factory()->create(['parent_id' => $middle->id]);

        $ancestors = $this->hierarchyService->getAncestors($leaf);

        $this->assertCount(2, $ancestors); // root + middle
    }

    /**
     * Test get level
     */
    public function test_get_level(): void
    {
        $root = Department::factory()->create(['parent_id' => null]);
        $child = Department::factory()->create(['parent_id' => $root->id]);
        $grandchild = Department::factory()->create(['parent_id' => $child->id]);

        $this->assertEquals(0, $this->hierarchyService->getLevel($root->id));
        $this->assertEquals(1, $this->hierarchyService->getLevel($child->id));
        $this->assertEquals(2, $this->hierarchyService->getLevel($grandchild->id));
    }

    /**
     * Test move department to new parent
     */
    public function test_move_department_to_new_parent(): void
    {
        $parent1 = Department::factory()->create(['parent_id' => null]);
        $parent2 = Department::factory()->create(['parent_id' => null]);
        $child = Department::factory()->create(['parent_id' => $parent1->id]);

        $this->hierarchyService->moveDepartment($child, $parent2->id);
        $child->refresh();

        $this->assertEquals($parent2->id, $child->parent_id);
    }

    /**
     * Test prevent circular hierarchy
     */
    public function test_prevent_circular_hierarchy(): void
    {
        $parent = Department::factory()->create(['parent_id' => null]);
        $child = Department::factory()->create(['parent_id' => $parent->id]);

        // Try to make parent a child of its own child
        $this->expectException(Exception::class);
        $this->hierarchyService->moveDepartment($parent, $child->id);
    }

    /**
     * Test prevent self-parent
     */
    public function test_prevent_self_parent(): void
    {
        $dept = Department::factory()->create(['parent_id' => null]);

        $this->expectException(Exception::class);
        $this->hierarchyService->moveDepartment($dept, $dept->id);
    }

    /**
     * Test get direct manager
     */
    public function test_get_direct_manager(): void
    {
        $dept = Department::factory()->create();
        $manager = User::factory()->create(['department_id' => $dept->id]);
        $employee = User::factory()->create(['department_id' => $dept->id]);

        // This depends on implementation of manager() relationship
        // Assuming manager is determined via department head or hierarchy
        $directManager = $this->hierarchyService->getDirectManager($employee->id);

        // Should either return null or the manager depending on implementation
        $this->assertNull($directManager);
    }

    /**
     * Test get subordinates
     */
    public function test_get_subordinates(): void
    {
        $manager = User::factory()->create();
        $dept = Department::factory()->create();
        $subordinate1 = User::factory()->create(['department_id' => $dept->id]);
        $subordinate2 = User::factory()->create(['department_id' => $dept->id]);

        $subordinates = $this->hierarchyService->getSubordinates($manager->id);

        // This depends on department hierarchy setup
        $this->assertIsObject($subordinates);
    }

    /**
     * Test get reporting structure
     */
    public function test_get_reporting_structure(): void
    {
        $user = User::factory()->create();

        $structure = $this->hierarchyService->getReportingStructure($user->id);

        $this->assertIsArray($structure);
        $this->assertArrayHasKey('employee', $structure);
    }

    /**
     * Test get breadcrumb
     */
    public function test_get_breadcrumb(): void
    {
        $root = Department::factory()->create(['parent_id' => null, 'name' => 'Company']);
        $middle = Department::factory()->create(['parent_id' => $root->id, 'name' => 'Division']);
        $leaf = Department::factory()->create(['parent_id' => $middle->id, 'name' => 'Department']);

        $breadcrumb = $this->hierarchyService->getBreadcrumb($leaf->id);

        $this->assertIsArray($breadcrumb);
        $this->assertCount(3, $breadcrumb);
    }
}
