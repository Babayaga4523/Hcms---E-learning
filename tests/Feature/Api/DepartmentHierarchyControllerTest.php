<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\Department;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DepartmentHierarchyControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Department $rootDept;
    protected Department $childDept;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();

        $this->rootDept = Department::factory()->create([
            'parent_id' => null,
            'level' => 0,
        ]);

        $this->childDept = Department::factory()->create([
            'parent_id' => $this->rootDept->id,
            'level' => 1,
        ]);
    }

    /**
     * Test GET /api/departments/tree
     */
    public function test_can_get_department_tree(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/departments/tree');

        $response->assertStatus(200)
            ->assertJsonStructure(['data']);
    }

    /**
     * Test GET /api/departments/{id}/path
     */
    public function test_can_get_department_path(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/departments/{$this->childDept->id}/path");

        $response->assertStatus(200)
            ->assertJsonStructure(['data']);
    }

    /**
     * Test GET /api/departments/{id}/descendants
     */
    public function test_can_get_descendants(): void
    {
        Department::factory()->create(['parent_id' => $this->childDept->id, 'level' => 2]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/departments/{$this->rootDept->id}/descendants");

        $response->assertStatus(200)
            ->assertJsonStructure(['data']);
    }

    /**
     * Test GET /api/departments/{id}/ancestors
     */
    public function test_can_get_ancestors(): void
    {
        $grandchildDept = Department::factory()->create([
            'parent_id' => $this->childDept->id,
            'level' => 2,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/departments/{$grandchildDept->id}/ancestors");

        $response->assertStatus(200)
            ->assertJsonStructure(['data']);
    }

    /**
     * Test GET /api/departments/{id}/breadcrumb
     */
    public function test_can_get_breadcrumb(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/departments/{$this->childDept->id}/breadcrumb");

        $response->assertStatus(200)
            ->assertJsonStructure(['data']);
    }

    /**
     * Test GET /api/departments/{id}/level
     */
    public function test_can_get_department_level(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/departments/{$this->childDept->id}/level");

        $response->assertStatus(200)
            ->assertJsonStructure(['data' => ['level']]);

        $this->assertEquals(1, $response->json('data.level'));
    }

    /**
     * Test PUT /api/departments/{id}/move
     */
    public function test_can_move_department(): void
    {
        $newParent = Department::factory()->create(['parent_id' => null, 'level' => 0]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson("/api/departments/{$this->childDept->id}/move", [
                'parent_id' => $newParent->id,
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('departments', [
            'id' => $this->childDept->id,
            'parent_id' => $newParent->id,
        ]);
    }

    /**
     * Test PUT /api/departments/{id}/move - prevent circular
     */
    public function test_cannot_create_circular_hierarchy(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson("/api/departments/{$this->rootDept->id}/move", [
                'parent_id' => $this->childDept->id,
            ]);

        $response->assertStatus(400);
    }

    /**
     * Test GET /api/reporting/user/{userId}/structure
     */
    public function test_can_get_reporting_structure(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/reporting/user/{$this->user->id}/structure");

        $response->assertStatus(200)
            ->assertJsonStructure(['data']);
    }

    /**
     * Test GET /api/reporting/user/{userId}/manager
     */
    public function test_can_get_user_manager(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/reporting/user/{$this->user->id}/manager");

        $response->assertStatus(200)
            ->assertJsonStructure(['data']);
    }

    /**
     * Test GET /api/reporting/user/{userId}/subordinates
     */
    public function test_can_get_user_subordinates(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/reporting/user/{$this->user->id}/subordinates");

        $response->assertStatus(200)
            ->assertJsonStructure(['data']);
    }

    /**
     * Test full hierarchy workflow
     */
    public function test_full_hierarchy_workflow(): void
    {
        // Create department hierarchy
        $exec = Department::factory()->create(['parent_id' => null, 'level' => 0, 'name' => 'Executive']);
        $division = Department::factory()->create(['parent_id' => $exec->id, 'level' => 1, 'name' => 'Division']);
        $dept = Department::factory()->create(['parent_id' => $division->id, 'level' => 2, 'name' => 'Department']);

        // Get tree
        $treeResponse = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/departments/tree');
        $treeResponse->assertStatus(200);

        // Get path
        $pathResponse = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/departments/{$dept->id}/path");
        $pathResponse->assertStatus(200);

        // Get breadcrumb
        $breadcrumbResponse = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/departments/{$dept->id}/breadcrumb");
        $breadcrumbResponse->assertStatus(200);

        // Get ancestors
        $ancestorsResponse = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/departments/{$dept->id}/ancestors");
        $ancestorsResponse->assertStatus(200);
    }
}
