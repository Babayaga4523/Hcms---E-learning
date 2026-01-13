<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Models\Module;
use App\Models\TrainingMaterial;
use App\Models\UserTraining;

uses(RefreshDatabase::class);

// Help IDEs (Intelephense) understand $this test context
use Tests\TestCase;
/** @var \Tests\TestCase $this */

it('completing a material updates module progress and user training status', function () {
    /** @var \Tests\TestCase $this */
    // Create user and module
    $user = User::factory()->create();

    // Create module without factory (minimal required fields)
    $module = Module::create([
        'title' => 'Test Module',
        'description' => 'Test description',
        'is_active' => true,
        'approval_status' => 'approved',
    ]);

    // Create a single training material (without factory)
    $material = TrainingMaterial::create([
        'module_id' => $module->id,
        'title' => 'Test Material',
        'file_type' => 'video',
        'file_path' => 'materials/test.mp4',
        'file_name' => 'test.mp4',
        'file_size' => 12345,
        'uploaded_by' => $user->id,
        'order' => 1,
    ]);

    // Enroll user
    $enrollment = UserTraining::create([
        'user_id' => $user->id,
        'module_id' => $module->id,
        'status' => 'enrolled',
        'enrolled_at' => now()
    ]);

    // Act as user and call complete endpoint
    $response = $this->actingAs($user)->postJson("/api/training/{$module->id}/material/{$material->id}/complete");
    $response->assertStatus(200);
    $response->assertJson(['success' => true]);

    // Assert ModuleProgress updated to 100
    $this->assertDatabaseHas('module_progress', [
        'user_id' => $user->id,
        'module_id' => $module->id,
        'progress_percentage' => 100,
        'status' => 'completed'
    ]);

    // Assert user training status updated to completed
    $this->assertDatabaseHas('user_trainings', [
        'user_id' => $user->id,
        'module_id' => $module->id,
        'status' => 'completed'
    ]);
});