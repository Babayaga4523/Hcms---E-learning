<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Module;
use App\Models\Question;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminCreateProgramWithQuestionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_program_with_questions_flattened_payload()
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $payload = [
            'title' => 'Test Program',
            'description' => 'Desc',
            'duration_minutes' => 60,
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
                ],
                [
                    'question_text' => 'Q2',
                    'question_type' => 'posttest',
                    'option_a' => 'A',
                    'option_b' => 'B',
                    'option_c' => 'C',
                    'option_d' => 'D',
                    'correct_answer' => 'b'
                ]
            ]
        ];

        $response = $this->actingAs($admin)->postJson('/api/admin/training-programs', $payload);
        $response->assertStatus(201);

        $this->assertDatabaseHas('modules', ['title' => 'Test Program']);
        $module = Module::where('title', 'Test Program')->first();
        $this->assertNotNull($module);
        $this->assertDatabaseCount('questions', 2);
        $this->assertDatabaseHas('questions', ['question_text' => 'Q1', 'question_type' => 'pretest']);
        $this->assertDatabaseHas('questions', ['question_text' => 'Q2', 'question_type' => 'posttest']);
    }

    public function test_admin_can_create_program_with_nested_program_payload()
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $nested = [
            'program' => [
                'title' => 'Nested Program',
                'description' => 'Desc',
                'duration_minutes' => 30,
                'passing_grade' => 60,
                'category' => 'Compliance',
                'is_active' => false,
                'questions' => [
                    [
                        'question_text' => 'NQ1',
                        'question_type' => 'pretest',
                        'option_a' => 'A',
                        'option_b' => 'B',
                        'option_c' => 'C',
                        'option_d' => 'D',
                        'correct_answer' => 'c'
                    ]
                ]
            ]
        ];

        $response = $this->actingAs($admin)->postJson('/api/admin/training-programs/with-questions', $nested);
        $response->assertStatus(201);

        $this->assertDatabaseHas('modules', ['title' => 'Nested Program']);
        $this->assertDatabaseHas('questions', ['question_text' => 'NQ1', 'question_type' => 'pretest']);
    }
}
