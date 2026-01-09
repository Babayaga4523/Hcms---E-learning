<?php

namespace App\Http\Controllers\Quiz;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreQuestionRequest;
use App\Http\Requests\UpdateQuestionRequest;
use App\Models\Question;
use App\Models\Quiz;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class QuestionController extends Controller
{
    /**
     * Get all questions (optionally filtered by quiz, search, category, difficulty)
     */
    public function index(Request $request): JsonResponse
    {
        $query = Question::query();
        
        // Optional filter by quiz_id
        if ($quizId = $request->query('quiz_id')) {
            $query->where('quiz_id', $quizId);
        }
        
        // Optional filter by search term
        if ($search = $request->query('search')) {
            $query->where('question_text', 'like', "%{$search}%");
        }
        
        // Optional filter by category
        if ($category = $request->query('category')) {
            $query->where('category', $category);
        }
        
        // Optional filter by difficulty
        if ($difficulty = $request->query('difficulty')) {
            $query->where('difficulty', $difficulty);
        }

        $questions = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'questions' => $questions,
            'total' => $questions->count()
        ]);
    }

    /**
     * Create a new question
     */
    public function store(StoreQuestionRequest $request): JsonResponse
    {
        try {
            $validated = $request->validated();

            // Handle image upload
            if ($request->hasFile('image_url')) {
                $image = $request->file('image_url');
                $path = $image->store('questions', 'public');
                $validated['image_url'] = '/storage/' . $path;
            }

            // Auto-assign points based on difficulty if not provided
            if (empty($validated['points'])) {
                $difficultyPoints = [
                    'easy' => 3,
                    'medium' => 5,
                    'hard' => 7,
                ];
                $validated['points'] = $difficultyPoints[$validated['difficulty']] ?? 5;
            }

            // Get next order number
            $maxOrder = Question::where('quiz_id', $validated['quiz_id'])
                ->max('order');
            $validated['order'] = ($maxOrder ?? 0) + 1;

            $question = Question::create($validated);

            // If question is a pretest/posttest, ensure module flags & quiz entry exist for user discovery
            try {
                $moduleId = $validated['module_id'] ?? null;
                if (!$moduleId && !empty($validated['quiz_id'])) {
                    $quiz = \App\Models\Quiz::find($validated['quiz_id']);
                    if ($quiz) $moduleId = $quiz->module_id;
                }

                if ($moduleId && in_array($validated['question_type'], ['pretest','posttest'])) {
                    $module = \App\Models\Module::find($moduleId);
                    if ($module) {
                        $updates = [];
                        if ($validated['question_type'] === 'pretest' && !$module->has_pretest) {
                            $updates['has_pretest'] = true;

                            $exists = \App\Models\Quiz::where(function($q) use ($module) {
                                $q->where('module_id', $module->id)->orWhere('training_program_id', $module->id);
                            })->where('type', 'pretest')->exists();

                            if (! $exists) {
                                \App\Models\Quiz::create([
                                    'module_id' => $module->id,
                                    'name' => $module->title . ' - Pre-Test',
                                    'type' => 'pretest',
                                    'description' => 'Auto-created pretest for this training.',
                                    'is_active' => true,
                                    'question_count' => \App\Models\Question::where('module_id', $module->id)->where('question_type', 'pretest')->count() ?: 5,
                                    'time_limit' => 15,
                                    'passing_score' => $module->passing_grade ?? 70,
                                ]);
                            }
                        }

                        if ($validated['question_type'] === 'posttest' && !$module->has_posttest) {
                            $updates['has_posttest'] = true;

                            $exists = \App\Models\Quiz::where(function($q) use ($module) {
                                $q->where('module_id', $module->id)->orWhere('training_program_id', $module->id);
                            })->where('type', 'posttest')->exists();

                            if (! $exists) {
                                \App\Models\Quiz::create([
                                    'module_id' => $module->id,
                                    'name' => $module->title . ' - Post-Test',
                                    'type' => 'posttest',
                                    'description' => 'Auto-created posttest for this training.',
                                    'is_active' => true,
                                    'question_count' => \App\Models\Question::where('module_id', $module->id)->where('question_type', 'posttest')->count() ?: 5,
                                    'time_limit' => 15,
                                    'passing_score' => $module->passing_grade ?? 70,
                                ]);
                            }
                        }

                        if (! empty($updates)) {
                            $module->update($updates);
                        }
                    }
                }
            } catch (\Exception $e) {
                // Non-fatal: don't break question creation on auxiliary failures
            }

            return response()->json($question, 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to create question',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get a specific question
     */
    public function show(Question $question): JsonResponse
    {
        return response()->json($question);
    }

    /**
     * Update a question
     */
    public function update(UpdateQuestionRequest $request, Question $question): JsonResponse
    {
        try {
            $validated = $request->validated();

            // Handle image upload
            if ($request->hasFile('image_url')) {
                // Delete old image if exists
                if ($question->image_url) {
                    $oldPath = str_replace('/storage/', '', $question->image_url);
                    Storage::disk('public')->delete($oldPath);
                }
                
                $image = $request->file('image_url');
                $path = $image->store('questions', 'public');
                $validated['image_url'] = '/storage/' . $path;
            }

            // Auto-assign points based on difficulty if not provided
            if (empty($validated['points'])) {
                $difficultyPoints = [
                    'easy' => 3,
                    'medium' => 5,
                    'hard' => 7,
                ];
                $validated['points'] = $difficultyPoints[$validated['difficulty']] ?? 5;
            }

            $question->update($validated);

            return response()->json($question);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to update question',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a question
     */
    public function destroy(Question $question): JsonResponse
    {
        try {
            // Delete image if exists
            if ($question->image_url) {
                $path = str_replace('/storage/', '', $question->image_url);
                Storage::disk('public')->delete($path);
            }
            
            $question->delete();

            return response()->json([
                'success' => true,
                'message' => 'Question deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to delete question',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Reorder questions
     */
    public function reorder(Request $request): JsonResponse
    {
        try {
            $questionIds = $request->input('question_ids', []);

            foreach ($questionIds as $index => $questionId) {
                Question::where('id', $questionId)
                    ->update(['order' => $index + 1]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Questions reordered successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to reorder questions',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Bulk import questions from CSV
     */
    public function bulkImport(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'quiz_id' => 'required|exists:quizzes,id',
                'file' => 'required|file|mimes:csv,txt',
            ]);

            $file = $request->file('file');
            $quizId = $request->input('quiz_id');

            $rows = array_map('str_getcsv', file($file->getRealPath()));
            $header = array_shift($rows); // Get header row

            $created = 0;
            $errors = [];

            foreach ($rows as $index => $row) {
                try {
                    if (count($row) < 3) {
                        $errors[] = "Row " . ($index + 2) . ": Missing required fields";
                        continue;
                    }

                    $maxOrder = Question::where('quiz_id', $quizId)->max('order');
                    
                    $data = [
                        'quiz_id' => $quizId,
                        'question_text' => $row[0],
                        'question_type' => $row[1] ?? 'multiple_choice',
                        'difficulty' => $row[2] ?? 'medium',
                        'points' => $row[3] ?? 5,
                        'options' => isset($row[4]) ? json_decode($row[4], true) : null,
                        'correct_answer' => $row[5] ?? '',
                        'explanation' => $row[6] ?? '',
                        'order' => ($maxOrder ?? 0) + $created + 1,
                    ];

                    Question::create($data);
                    $created++;
                } catch (\Exception $e) {
                    $errors[] = "Row " . ($index + 2) . ": " . $e->getMessage();
                }
            }

            return response()->json([
                'success' => true,
                'created' => $created,
                'errors' => $errors,
                'total_rows' => count($rows),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to import questions',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Export questions as CSV
     */
    public function export(Request $request): JsonResponse
    {
        try {
            $quizId = $request->query('quiz_id');
            
            if (!$quizId) {
                return response()->json([
                    'error' => 'Quiz ID is required',
                ], 400);
            }

            $questions = Question::where('quiz_id', $quizId)
                ->orderBy('order')
                ->get();

            $csv = "Question Text,Type,Difficulty,Points,Options (JSON),Correct Answer,Explanation\n";

            foreach ($questions as $q) {
                $options = is_array($q->options) ? json_encode($q->options) : '';
                $csv .= sprintf(
                    '"%s","%s","%s",%d,"%s","%s","%s"' . "\n",
                    addslashes($q->question_text),
                    $q->question_type,
                    $q->difficulty,
                    $q->points,
                    addslashes($options),
                    addslashes($q->correct_answer ?? ''),
                    addslashes($q->explanation ?? '')
                );
            }

            return response()->json([
                'success' => true,
                'csv' => $csv,
                'filename' => "quiz_questions_" . time() . ".csv",
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to export questions',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get question statistics for a quiz
     */
    public function statistics(Request $request): JsonResponse
    {
        try {
            $quizId = $request->query('quiz_id');
            
            // If quiz_id provided, return statistics for that quiz
            // Otherwise, return global statistics for all questions
            $query = Question::query();
            
            if ($quizId) {
                $query->where('quiz_id', $quizId);
            }

            $stats = [
                'total_questions' => $query->count(),
                'by_type' => (clone $query)
                    ->groupBy('question_type')
                    ->selectRaw('question_type, count(*) as count')
                    ->pluck('count', 'question_type'),
                'by_difficulty' => (clone $query)
                    ->groupBy('difficulty')
                    ->selectRaw('difficulty, count(*) as count')
                    ->pluck('count', 'difficulty'),
                'total_points' => (clone $query)
                    ->sum('points'),
            ];

            return response()->json($stats);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to get statistics',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
