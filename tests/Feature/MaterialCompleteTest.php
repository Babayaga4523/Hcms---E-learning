<?php

uses(Tests\TestCase::class, Illuminate\Foundation\Testing\RefreshDatabase::class);

it('allows user to mark material complete', function () {
    /** @var \Tests\TestCase $this */

    $user = App\Models\User::factory()->create();
    $module = App\Models\Module::factory()->create();
    $material = App\Models\TrainingMaterial::factory()->create(['module_id' => $module->id]);

    App\Models\UserTraining::create([
        'user_id' => $user->id,
        'module_id' => $module->id,
        'status' => 'in_progress'
    ]);

    $response = $this->actingAs($user)->postJson("/api/training/{$module->id}/material/{$material->id}/complete");

    $response->assertOk()->assertJson(['success' => true]);

    $this->assertDatabaseHas('user_material_progress', [
        'user_id' => $user->id,
        'training_material_id' => $material->id,
        'is_completed' => true
    ]);
});
