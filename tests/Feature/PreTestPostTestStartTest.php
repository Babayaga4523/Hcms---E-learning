<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Models\Module;
use Illuminate\Support\Facades\DB;

class PreTestPostTestStartTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function start_exam_creates_attempt_and_snapshots_questions()
    {
        // Arrange
        $user = User::factory()->create(['role' => 'user']);
        $module = Module::factory()->create([ 'duration_minutes' => 30, 'questions_limit' => 3 ]);

        // Insert 5 questions for module
        $questions = [];
        for ($i = 1; $i <= 5; $i++) {
            $questions[] = [
                'module_id' => $module->id,
                'question_text' => "Question $i",
                'option_a' => 'A',
                'option_b' => 'B',
                'option_c' => 'C',
                'option_d' => 'D',
                'correct_answer' => $i % 2 == 0 ? 'b' : 'a',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        DB::table('questions')->insert($questions);

        // Enroll user in module
        DB::table('user_trainings')->insert([
            'user_id' => $user->id,
            'module_id' => $module->id,
            'status' => 'in_progress',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Act
        $res = $this->actingAs($user)->postJson("/api/admin/pretest-posttest/start/{$module->id}", [
            'exam_type' => 'pre_test'
        ]);

        // Assert
        $res->assertStatus(200);
        $payload = $res->json('data');

        $this->assertArrayHasKey('exam_attempt_id', $payload);
        $this->assertEquals('pre_test', $payload['exam_type']);

        // Check snapshot: 3 records present in user_exam_answers
        $attemptId = $payload['exam_attempt_id'];
        $rows = DB::table('user_exam_answers')->where('exam_attempt_id', $attemptId)->where('user_id', $user->id)->get();
        $this->assertCount(3, $rows);
    }
}
