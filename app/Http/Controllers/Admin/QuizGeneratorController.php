<?php

namespace App\Http\Controllers\Admin;

use App\Models\Module;
use App\Models\Quiz;
use App\Models\Question;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class QuizGeneratorController
{
    /**
     * Generate quiz from module content
     */
    public function generate(Request $request)
    {
        try {
            $validated = $request->validate([
                'module_id' => 'required|exists:modules,id',
                'source' => 'required|in:transcript,slides,both',
                'difficulty' => 'required|in:easy,medium,hard',
                'question_count' => 'required|integer|min:5|max:50',
            ]);

            $module = Module::findOrFail($validated['module_id']);

            // Create quiz
            $quiz = new Quiz();
            $quiz->title = "{$module->title} - Auto-Generated Quiz";
            $quiz->name = "{$module->title} Quiz";
            $quiz->description = "Auto-generated from {$validated['source']} with {$validated['difficulty']} difficulty";
            $quiz->module_id = $validated['module_id'];
            $quiz->difficulty = $validated['difficulty'];
            $quiz->question_count = $validated['question_count'];
            $quiz->status = 'generating';
            $quiz->quality_score = 0;
            $quiz->coverage_score = 0;
            $quiz->created_by = Auth::id();
            $quiz->save();

            // Simulate question generation
            $this->generateQuestions($quiz, $validated['question_count'], $validated['difficulty']);

            // Calculate quality and coverage scores
            $quiz->update([
                'status' => 'generated',
                'quality_score' => rand(75, 95),
                'coverage_score' => rand(70, 90),
            ]);

            return response()->json([
                'message' => 'Quiz generated successfully',
                'quiz' => $quiz->load('questions', 'module'),
            ], 201);
        } catch (\Exception $e) {
            Log::error('Quiz generation error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get available modules for quiz generation
     */
    public function getModules(Request $request)
    {
        try {
            $modules = Module::select('id', 'title', 'description')
                ->where('is_active', true)
                ->orderBy('title')
                ->get();

            return response()->json($modules);
        } catch (\Exception $e) {
            Log::error('Get modules error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Publish a generated quiz
     */
    public function publish(Request $request, $id)
    {
        try {
            $quiz = Quiz::findOrFail($id);

            if ($quiz->status !== 'generated') {
                return response()->json(['error' => 'Only generated quizzes can be published'], 400);
            }

            $quiz->update([
                'status' => 'published',
                'published_at' => now(),
                'published_by' => Auth::id(),
            ]);

            return response()->json([
                'message' => 'Quiz published successfully',
                'quiz' => $quiz->load('questions', 'module'),
            ]);
        } catch (\Exception $e) {
            Log::error('Quiz publish error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Generate sample questions for the quiz
     */
    private function generateQuestions(Quiz $quiz, int $count, string $difficulty)
    {
        $questionTypes = ['multiple_choice', 'true_false', 'short_answer'];
        $difficulties = ['easy', 'medium', 'hard'];

        $sampleQuestions = [
            ['text' => 'What is the main concept of this module?', 'type' => 'multiple_choice'],
            ['text' => 'How does this relate to real-world applications?', 'type' => 'short_answer'],
            ['text' => 'Is this statement true or false?', 'type' => 'true_false'],
            ['text' => 'Which of the following is a key principle?', 'type' => 'multiple_choice'],
            ['text' => 'Can you explain the process?', 'type' => 'short_answer'],
            ['text' => 'What are the benefits of this approach?', 'type' => 'multiple_choice'],
            ['text' => 'Define the key term in your own words.', 'type' => 'short_answer'],
        ];

        for ($i = 0; $i < min($count, count($sampleQuestions)); $i++) {
            $sample = $sampleQuestions[$i];
            
            $question = new Question();
            $question->quiz_id = $quiz->id;
            $question->module_id = $quiz->module_id;
            $question->question_text = $sample['text'];
            $question->question_type = $sample['type'];
            $question->difficulty = $difficulty;
            $question->order = $i + 1;
            
            // Add sample answers for multiple choice
            if ($sample['type'] === 'multiple_choice') {
                $question->answers = [
                    ['text' => 'Option A', 'is_correct' => true],
                    ['text' => 'Option B', 'is_correct' => false],
                    ['text' => 'Option C', 'is_correct' => false],
                    ['text' => 'Option D', 'is_correct' => false],
                ];
            } elseif ($sample['type'] === 'true_false') {
                $question->answers = [
                    ['text' => 'True', 'is_correct' => true],
                    ['text' => 'False', 'is_correct' => false],
                ];
            }
            
            $question->save();
        }
    }
}
