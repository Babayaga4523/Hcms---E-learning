<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Models\Module;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PreTestPostTestSubmitTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function submit_exam_computes_score_and_finishes_attempt()
    {
        $user = User::factory()->create(['role' => 'user']);
        $module = Module::factory()->create([ 'duration_minutes' => 30, 'questions_limit' => 3, 'passing_grade' => 50 ]);

        // Insert 3 questions
        $qIds = [];
        for ($i = 1; $i <= 3; $i++) {
            $id = DB::table('questions')->insertGetId([
                'module_id' => $module->id,
                'question_text' => "Q $i",
                'option_a' => 'A',
                'option_b' => 'B',
                'option_c' => 'C',
                'option_d' => 'D',
                'correct_answer' => $i === 1 ? 'a' : 'b',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $qIds[] = $id;
        }

        DB::table('user_trainings')->insert([
            'user_id' => $user->id,
            'module_id' => $module->id,
            'status' => 'in_progress',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Start exam via API to generate attempt and snapshots
        $start = $this->actingAs($user)->postJson("/api/admin/pretest-posttest/start/{$module->id}", ['exam_type' => 'pre_test']);
        $start->assertStatus(200);
        $attemptId = $start->json('data.exam_attempt_id');

        // Fetch assigned questions snapshot
        $assigned = DB::table('user_exam_answers')->where('exam_attempt_id', $attemptId)->pluck('question_id')->toArray();
        $this->assertNotEmpty($assigned);

        // Prepare answers: answer first correct, others incorrect
        $answers = [];
        foreach ($assigned as $qid) {
            $correct = DB::table('questions')->where('id', $qid)->value('correct_answer');
            // set user answer: if qid == first, use correct, else wrong
            $userAns = ($qid === $assigned[0]) ? $correct : ($correct === 'a' ? 'b' : 'a');
            $answers[] = ['question_id' => $qid, 'user_answer' => $userAns];
        }

        // Submit
        $submit = $this->actingAs($user)->postJson("/api/admin/pretest-posttest/submit/{$attemptId}", ['answers' => $answers]);
        $submit->assertStatus(200);

        $payload = $submit->json('data');
        $this->assertEquals(1, $payload['correct_answers']);
        $this->assertEquals(3, $payload['total_questions']);

        // Ensure attempt is finished in DB
        $attempt = DB::table('exam_attempts')->where('id', $attemptId)->first();
        $this->assertNotNull($attempt->finished_at);
        $this->assertEquals(1, $attempt->score);
    }

    /** @test */
    public function submit_exam_after_deadline_is_rejected_and_auto_finished()
    {
        $user = User::factory()->create(['role' => 'user']);
        $module = Module::factory()->create([ 'duration_minutes' => 1, 'questions_limit' => 1 ]);

        $qid = DB::table('questions')->insertGetId([
            'module_id' => $module->id,
            'question_text' => 'Timeout Q',
            'option_a' => 'A',
            'option_b' => 'B',
            'option_c' => 'C',
            'option_d' => 'D',
            'correct_answer' => 'a',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('user_trainings')->insert([
            'user_id' => $user->id,
            'module_id' => $module->id,
            'status' => 'in_progress',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $start = $this->actingAs($user)->postJson("/api/admin/pretest-posttest/start/{$module->id}", ['exam_type' => 'pre_test']);
        $start->assertStatus(200);
        $attemptId = $start->json('data.exam_attempt_id');

        // Fast-forward time beyond duration
        $past = Carbon::now()->subMinutes(10);
        DB::table('exam_attempts')->where('id', $attemptId)->update(['started_at' => $past]);

        $submit = $this->actingAs($user)->postJson("/api/admin/pretest-posttest/submit/{$attemptId}", ['answers' => [['question_id' => $qid, 'user_answer' => 'a']]]);
        $submit->assertStatus(408);

        $attempt = DB::table('exam_attempts')->where('id', $attemptId)->first();
        $this->assertNotNull($attempt->finished_at);
    }
}
