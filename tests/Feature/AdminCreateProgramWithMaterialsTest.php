<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Module;
use App\Models\TrainingMaterial;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class AdminCreateProgramWithMaterialsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_program_with_material_upload()
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $file = UploadedFile::fake()->create('doc.pdf', 100);

        $payload = [
            'title' => 'Program With Material',
            'description' => 'Desc',
            'duration_minutes' => 45,
            'passing_grade' => 70,
            'category' => 'Technical',
            'is_active' => true,
            'questions' => [
                [
                    'question_text' => 'Q1',
                    'question_type' => 'pretest',
                    'option_a' => 'A',
                    'option_b' => 'B',
                    'option_c' => 'C',
                    'option_d' => 'D',
                    'correct_answer' => 'a'
                ]
            ],
            'materials' => [
                [
                    'title' => 'Manual PDF',
                    'type' => 'document',
                    'description' => 'Sample',
                    'file' => $file
                ]
            ]
        ];

        $response = $this->actingAs($admin)->post('/api/admin/training-programs', $payload);

        $response->assertStatus(201);

        $this->assertDatabaseHas('modules', ['title' => 'Program With Material']);
        $module = Module::where('title', 'Program With Material')->first();
        $this->assertNotNull($module);

        $this->assertDatabaseHas('training_materials', ['title' => 'Manual PDF', 'module_id' => $module->id]);
    }
}
