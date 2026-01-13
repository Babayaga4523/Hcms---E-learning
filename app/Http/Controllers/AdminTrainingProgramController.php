<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Module;
use App\Models\Question;
use App\Models\TrainingMaterial;
use App\Models\ModuleAssignment;
use App\Models\TrainingDiscussion;
use App\Models\User;
use App\Models\UserTraining;
use App\Services\PdfConverterService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class AdminTrainingProgramController extends Controller
{
    /**
     * Display training programs list
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            abort(403, 'Unauthorized');
        }

        try {
            $query = Module::select('id', 'title', 'description', 'is_active', 'passing_grade', 'created_at')
                ->withCount('questions as total_questions');

            // Search
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%")
                      ->orWhere('category', 'like', "%{$search}%");
                });
            }

            // Filter by status
            if ($request->has('status') && $request->status && $request->status !== 'all') {
                $query->where('is_active', $request->status === 'active');
            }

            // Filter by category
            if ($request->has('category') && $request->category && $request->category !== 'all') {
                $query->where('category', $request->category);
            }

            // Sorting
            $sortBy = $request->get('sortBy', 'created_at');
            $sortOrder = $request->get('sortOrder', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            $programs = $query->paginate(15)->map(function($module) {
                // Get completion statistics
                $enrollmentCount = DB::table('user_trainings')->where('module_id', $module->id)->count();
                $completionCount = DB::table('user_trainings')
                    ->where('module_id', $module->id)
                    ->where('status', 'completed')
                    ->count();
                $completionRate = $enrollmentCount > 0 ? round(($completionCount / $enrollmentCount) * 100, 2) : 0;

                return [
                    'id' => $module->id,
                    'title' => $module->title,
                    'description' => $module->description,
                    'duration_minutes' => $module->duration_minutes ?? 60,
                    'is_active' => $module->is_active,
                    'passing_grade' => $module->passing_grade,
                    'category' => $module->category ?? null,
                    'cover_image' => $module->cover_image ?? null,
                    'total_questions' => $module->total_questions,
                    'enrollment_count' => $enrollmentCount,
                    'completion_count' => $completionCount,
                    'completion_rate' => $completionRate,
                    'expiry_date' => $module->expiry_date ?? null,
                    'created_at' => $module->created_at,
                    'status' => $module->is_active ? 'Aktif' : 'Nonaktif',
                ];
            });

            // Get statistics
            $totalTrainings = DB::table('user_trainings')->count();
            $completedTrainings = DB::table('user_trainings')->where('status', 'completed')->count();
            
            $stats = [
                'total_programs' => Module::count(),
                'active_programs' => Module::where('is_active', true)->count(),
                'inactive_programs' => Module::where('is_active', false)->count(),
                'total_questions' => Question::count(),
                'avg_completion_rate' => $totalTrainings > 0 ? round(($completedTrainings / $totalTrainings) * 100, 2) : 0,
            ];

            // Get categories for filter
            $categories = Module::whereNotNull('category')
                ->where('category', '!=', '')
                ->distinct()
                ->pluck('category')
                ->filter()
                ->values();

            // Check if this is an API request
            if ($request->wantsJson()) {
                return response()->json([
                    'data' => $programs->items(),
                    'current_page' => $programs->currentPage(),
                    'last_page' => $programs->lastPage(),
                    'per_page' => $programs->perPage(),
                    'total' => $programs->total(),
                    'stats' => $stats,
                    'categories' => $categories,
                ]);
            }

            return Inertia::render('Admin/TrainingProgram', [
                'programs' => $programs,
                'stats' => $stats,
                'categories' => $categories,
                'filters' => [
                    'search' => $request->search ?? '',
                    'status' => $request->status ?? 'all',
                    'category' => $request->category ?? 'all',
                    'sortBy' => $sortBy,
                    'sortOrder' => $sortOrder,
                ],
                'auth' => ['user' => (array) $user],
            ]);
        } catch (\Exception $e) {
            // Log the actual error for debugging
            Log::error('Training Program Error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            
            // Return detailed error for API requests
            if ($request->wantsJson()) {
                return response()->json([
                    'error' => 'Error loading training programs',
                    'message' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ], 500);
            }
            
            abort(500, 'Error loading training programs');
        }
    }

    /**
     * Create new training program (Unified & Fixed)
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Support nested payload: accept { program: { ... } } for backward compatibility
        if ($request->has('program') && is_array($request->program)) {
            $program = $request->input('program');
            // Merge top-level scalar and array fields into request root for validation and processing
            foreach ($program as $k => $v) {
                $request->merge([$k => $v]);
            }
            // Also ensure nested questions arrays are available at expected keys
            if (isset($program['questions']) && is_array($program['questions'])) {
                $request->merge(['questions' => $program['questions']]);
            }
            if (isset($program['pre_test_questions']) && is_array($program['pre_test_questions'])) {
                $request->merge(['pre_test_questions' => $program['pre_test_questions']]);
            }
            if (isset($program['post_test_questions']) && is_array($program['post_test_questions'])) {
                $request->merge(['post_test_questions' => $program['post_test_questions']]);
            }
        }

        // 1. Validation (Security & Data Integrity)
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'duration_minutes' => 'required|integer|min:1',
            'passing_grade' => 'required|integer|min:0|max:100',
            'category' => 'nullable|string|max:255',
            'is_active' => 'boolean',
            'allow_retake' => 'boolean',
            'max_retake_attempts' => 'nullable|integer|min:1',
            'expiry_date' => 'nullable|date',
            'prerequisite_module_id' => 'nullable|exists:modules,id',
            'instructor_id' => 'nullable|exists:users,id',
            'certificate_template' => 'nullable|string',
            // Validasi Array Materials
            'materials.*.file' => 'sometimes|nullable|file|mimes:pdf,mp4,doc,docx,ppt,pptx,xls,xlsx|max:20480', // Max 20MB, optional for testing
            'materials.*.title' => 'required|string',
            'materials.*.description' => 'nullable|string',
            'materials.*.duration' => 'nullable|integer|min:0',
            'materials.*.order' => 'nullable|integer|min:0',
            // Validasi Array Questions (Unified format)
            'questions.*.question_text' => 'nullable|string',
            'questions.*.question_type' => 'nullable|in:pretest,posttest',
            'questions.*.option_a' => 'nullable|string',
            'questions.*.option_b' => 'nullable|string',
            'questions.*.option_c' => 'nullable|string',
            'questions.*.option_d' => 'nullable|string',
            'questions.*.correct_answer' => 'nullable|in:a,b,c,d',
            'questions.*.explanation' => 'nullable|string',
            'questions.*.image_url' => 'nullable|image|max:5120',
            // New: quiz time limits in minutes
            'pretest_duration' => 'nullable|integer|min:1',
            'posttest_duration' => 'nullable|integer|min:1',
            // Also accept frontend field names with _minutes suffix for compatibility
            'pretest_duration_minutes' => 'nullable|integer|min:1',
            'posttest_duration_minutes' => 'nullable|integer|min:1',
            // Alternative format: separate pre/post test questions
            'pre_test_questions.*.question_text' => 'nullable|string',
            'pre_test_questions.*.option_a' => 'nullable|string',
            'pre_test_questions.*.option_b' => 'nullable|string',
            'pre_test_questions.*.option_c' => 'nullable|string',
            'pre_test_questions.*.option_d' => 'nullable|string',
            'pre_test_questions.*.correct_answer' => 'nullable|in:a,b,c,d',
            'pre_test_questions.*.explanation' => 'nullable|string',
            'pre_test_questions.*.image_url' => 'nullable|image|max:5120',
            'post_test_questions.*.question_text' => 'nullable|string',
            'post_test_questions.*.option_a' => 'nullable|string',
            'post_test_questions.*.option_b' => 'nullable|string',
            'post_test_questions.*.option_c' => 'nullable|string',
            'post_test_questions.*.option_d' => 'nullable|string',
            'post_test_questions.*.correct_answer' => 'nullable|in:a,b,c,d',
            'post_test_questions.*.explanation' => 'nullable|string',
            'post_test_questions.*.image_url' => 'nullable|image|max:5120',
        ]);

        // 2. Gunakan Database Transaction
        // Jika satu part gagal, semua dibatalkan (Rollback)
        DB::beginTransaction();

        try {
            // A. Simpan Module / Program Utama
            $module = Module::create([
                'title' => $request->title,
                'description' => $request->description,
                'duration_minutes' => $request->duration_minutes,
                'passing_grade' => $request->passing_grade,
                'category' => $request->category ?? null,
                'is_active' => filter_var($request->is_active ?? false, FILTER_VALIDATE_BOOLEAN),
                'allow_retake' => filter_var($request->allow_retake ?? false, FILTER_VALIDATE_BOOLEAN),
                'max_retake_attempts' => $request->allow_retake ? ($request->max_retake_attempts ?? 3) : 0,
                'expiry_date' => $request->expiry_date ?? null,
                'prerequisite_module_id' => $request->prerequisite_module_id ?? null,
                'instructor_id' => $request->instructor_id ?? null,
                'certificate_template' => $request->certificate_template ?? null,
                // Kita update flag ini nanti setelah menghitung soal
                'has_pretest' => false,
                'has_posttest' => false,
            ]);

            // B. Handle Materials (File Upload)
            if ($request->has('materials')) {
                foreach ($request->materials as $matData) {
                    if (isset($matData['file']) && $matData['file']->isValid()) {

                        // Buat nama file unik (Future-proof & Security)
                        $filename = time() . '_' . preg_replace('/\s+/', '_', $matData['file']->getClientOriginalName());

                        // Simpan ke storage/app/public/materials
                        $path = $matData['file']->storeAs('public/materials', $filename);

                        // Simpan ke Database
                        $materialData = [
                            'module_id' => $module->id,
                            'title' => $matData['title'],
                            'description' => $matData['description'] ?? null,
                            'file_path' => 'materials/' . $filename, // Path relatif untuk akses public
                            'file_name' => $matData['file']->getClientOriginalName(), // Nama file asli
                            'file_type' => $matData['file']->getClientOriginalExtension(),
                            'file_size' => $matData['file']->getSize(), // Ukuran file dalam bytes
                            'duration_minutes' => $matData['duration'] ?? 0,
                            'order' => $matData['order'] ?? 0,
                            'uploaded_by' => $user->id,
                        ];

                        // Jika file adalah PDF, set pdf_path juga
                        if (strtolower($matData['file']->getClientOriginalExtension()) === 'pdf') {
                            $materialData['pdf_path'] = 'materials/' . $filename;
                        }

                        TrainingMaterial::create($materialData);
                    }
                }
            }

            // C. Handle Questions & Auto-Create Quizzes
            $hasPretest = false;
            $hasPosttest = false;

            // Combine questions from both formats (unified and separate)
            $allQuestions = [];

            // Handle unified questions format (if provided)
            if ($request->has('questions') && is_array($request->questions) && count($request->questions) > 0) {
                foreach ($request->questions as $qData) {
                    if (!empty($qData['question_text']) && !empty($qData['question_type'])) {
                        $allQuestions[] = $qData;
                    }
                }
            }

            // Handle separate pre/post test questions format (from frontend)
            if ($request->has('pre_test_questions') && is_array($request->pre_test_questions)) {
                foreach ($request->pre_test_questions as $qData) {
                    if (!empty($qData['question_text'])) {
                        $qData['question_type'] = 'pretest';
                        $allQuestions[] = $qData;
                    }
                }
            }

            if ($request->has('post_test_questions') && is_array($request->post_test_questions)) {
                foreach ($request->post_test_questions as $qData) {
                    if (!empty($qData['question_text'])) {
                        $qData['question_type'] = 'posttest';
                        $allQuestions[] = $qData;
                    }
                }
            }

            Log::info('Questions data received:', ['questions' => $allQuestions]);

            if (count($allQuestions) > 0) {
                // Debug: dump first question payload when running tests
                try {
                    if (app()->runningInConsole()) {
                        fwrite(STDOUT, "AllQuestions payload: " . json_encode(array_slice($allQuestions,0,3)) . "\n");
                    }
                } catch (\Exception $e) {
                    Log::info('Could not write debug output: ' . $e->getMessage());
                }

                Log::info('Processing ' . count($allQuestions) . ' questions');

                // Prepare explicit quiz headers using requested durations (if provided).
                // Accept either `pretest_duration` or `pretest_duration_minutes` from frontend (backwards/forwards compatible).
                $pretestTime = $request->input('pretest_duration') ?? $request->input('pretest_duration_minutes') ?? 30;
                $posttestTime = $request->input('posttest_duration') ?? $request->input('posttest_duration_minutes') ?? 60;

                // Ensure integer values
                $pretestTime = is_numeric($pretestTime) ? intval($pretestTime) : 30;
                $posttestTime = is_numeric($posttestTime) ? intval($posttestTime) : 60;

                $pretestQuiz = \App\Models\Quiz::firstOrCreate(
                    ['module_id' => $module->id, 'type' => 'pretest'],
                    [
                        'name' => 'Pre-Test: ' . $module->title,
                        'description' => 'Ujian awal untuk mengukur pengetahuan sebelum materi.',
                        'is_active' => true,
                        'time_limit' => $pretestTime,
                        'passing_score' => 0,
                        'question_count' => 0
                    ]
                );

                $posttestQuiz = \App\Models\Quiz::firstOrCreate(
                    ['module_id' => $module->id, 'type' => 'posttest'],
                    [
                        'name' => 'Post-Test: ' . $module->title,
                        'description' => 'Ujian akhir untuk evaluasi kelulusan.',
                        'is_active' => true,
                        'time_limit' => $posttestTime,
                        'passing_score' => $module->passing_grade ?? 70,
                        'question_count' => 0
                    ]
                );

                foreach ($allQuestions as $index => $qData) {
                    Log::info('Processing question ' . $index, ['data' => $qData]);

                    $qType = $qData['question_type'] ?? 'pretest'; // Default to pretest if not specified

                    // Determine quiz header based on question type
                    if ($qType === 'pretest') {
                        $quiz = $pretestQuiz;
                    } elseif ($qType === 'posttest') {
                        $quiz = $posttestQuiz;
                    } else {
                        // fallback: create or find a generic quiz of this type
                        $quiz = \App\Models\Quiz::firstOrCreate(
                            ['module_id' => $module->id, 'type' => $qType],
                            [
                                'name' => ucfirst($qType) . ' for ' . $module->title,
                                'description' => 'Auto-created ' . $qType . ' for this training.',
                                'is_active' => true,
                                'question_count' => 0, // Will be updated later
                                'time_limit' => 30,
                                'passing_score' => $module->passing_grade ?? 70,
                            ]
                        );
                    }

                    Log::info('Quiz created/found', ['quiz_id' => $quiz->id, 'type' => $qType]);

                    // Handle Image Upload untuk Question
                    $imageUrl = null;
                    if (isset($qData['image_url']) && $qData['image_url']->isValid()) {
                        try {
                            $imageFilename = time() . '_question_' . uniqid() . '.' . $qData['image_url']->getClientOriginalExtension();
                            $path = $qData['image_url']->storeAs('public/questions', $imageFilename);

                            // Verify file was actually stored
                            if (Storage::exists('public/questions/' . $imageFilename)) {
                                $imageUrl = 'storage/questions/' . $imageFilename; // Path relatif untuk akses public
                                Log::info('Question image uploaded successfully', ['filename' => $imageFilename, 'path' => $path]);
                            } else {
                                Log::error('Question image upload failed - file not found after storage', ['filename' => $imageFilename]);
                            }
                        } catch (\Exception $e) {
                            Log::error('Question image upload failed', [
                                'error' => $e->getMessage(),
                                'question_text' => substr($qData['question_text'], 0, 50) . '...'
                            ]);
                        }
                    }

                    // Build normalized options array and also keep legacy fields for compatibility
                    $normalizedOptions = [
                        ['label' => 'a', 'text' => ($qData['option_a'] ?? null)],
                        ['label' => 'b', 'text' => ($qData['option_b'] ?? null)],
                        ['label' => 'c', 'text' => ($qData['option_c'] ?? null)],
                        ['label' => 'd', 'text' => ($qData['option_d'] ?? null)],
                    ];

                    $questionData = [
                        'module_id' => $module->id,
                        'quiz_id' => $quiz->id,
                        'question_text' => $qData['question_text'],
                        'question_type' => $qType,
                        'options' => $normalizedOptions,
                        'correct_answer' => $qData['correct_answer'] ?? null,
                        'explanation' => $qData['explanation'] ?? null,
                        'image_url' => $imageUrl,
                        'order' => $index + 1, // Use index for order
                        'difficulty' => $qData['difficulty'] ?? 'medium',
                    ];

                    // Only set legacy option columns if DB has them
                    if (Schema::hasColumn('questions', 'option_a')) {
                        $questionData['option_a'] = $qData['option_a'] ?? null;
                        $questionData['option_b'] = $qData['option_b'] ?? null;
                        $questionData['option_c'] = $qData['option_c'] ?? null;
                        $questionData['option_d'] = $qData['option_d'] ?? null;
                    }

                    $question = Question::create($questionData);

                    Log::info('Question created', ['question_id' => $question->id, 'type' => $qType]);

                    if ($qType === 'pretest') $hasPretest = true;
                    if ($qType === 'posttest') $hasPosttest = true;
                }

                Log::info('Questions processing complete', ['hasPretest' => $hasPretest, 'hasPosttest' => $hasPosttest]);
            } else {
                Log::info('No questions received or questions array is empty');
            }

            // Update module flags
            $module->update([
                'has_pretest' => $hasPretest,
                'has_posttest' => $hasPosttest
            ]);

            Log::info('Module flags updated', ['module_id' => $module->id, 'has_pretest' => $hasPretest, 'has_posttest' => $hasPosttest]);

            // Update quiz question counts
            if ($hasPretest) {
                $pretestQuiz = \App\Models\Quiz::where('module_id', $module->id)->where('type', 'pretest')->first();
                if ($pretestQuiz) {
                    $questionCount = Question::where('module_id', $module->id)->where('question_type', 'pretest')->count();
                    $pretestQuiz->update(['question_count' => $questionCount]);
                    Log::info('Pretest quiz updated', ['quiz_id' => $pretestQuiz->id, 'question_count' => $questionCount]);
                }
            }
            if ($hasPosttest) {
                $posttestQuiz = \App\Models\Quiz::where('module_id', $module->id)->where('type', 'posttest')->first();
                if ($posttestQuiz) {
                    $questionCount = Question::where('module_id', $module->id)->where('question_type', 'posttest')->count();
                    $posttestQuiz->update(['question_count' => $questionCount]);
                    Log::info('Posttest quiz updated', ['quiz_id' => $posttestQuiz->id, 'question_count' => $questionCount]);
                }
            }

            // Jika semua lancar, Commit ke database
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Training Program, Materi, dan Quiz berhasil dibuat.',
                'data' => $module,
                // Include `program` key for frontends that expect it (backwards compatibility)
                'program' => $module,
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Validasi gagal', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            // Jika ada error, batalkan semua perubahan database
            DB::rollBack();

            // Log error untuk developer (Observability)
            Log::error('Gagal membuat Training Program: ' . $e->getMessage());
            Log::error('Trace: ' . $e->getTraceAsString());

            // Kembalikan ke form dengan pesan error
            return response()->json(['success' => false, 'message' => 'Terjadi kesalahan sistem: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Show training program details
     */
    public function show($id)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            abort(403, 'Unauthorized');
        }

        try {
            $program = Module::with('questions')->findOrFail($id);

            // Get enrollment and completion statistics
            $enrollmentCount = DB::table('user_trainings')->where('module_id', $id)->count();
            // Rely on status = 'completed' for completed enrollments
            $completionCount = DB::table('user_trainings')
                ->where('module_id', $id)
                ->where('status', 'completed')
                ->count();
            $completionRate = $enrollmentCount > 0 ? round(($completionCount / $enrollmentCount) * 100, 2) : 0;

            // Get materials
            $materials = TrainingMaterial::where('module_id', $id)
                ->select('id', 'title', 'file_type', 'file_size', 'duration_minutes', 'version', 'order', 'created_at')
                ->orderBy('order')
                ->get();

            // Get prerequisite module
            $prerequisiteModule = null;
            if ($program->prerequisite_module_id) {
                $prerequisiteModule = Module::find($program->prerequisite_module_id);
            }

            // Get learner progress
            $learnerProgress = DB::table('user_trainings')
                ->where('module_id', $id)
                ->join('users', 'user_trainings.user_id', '=', 'users.id')
                ->select('users.id', 'users.name', 'users.email', 'user_trainings.status', 'user_trainings.final_score', 'user_trainings.completed_at')
                ->get();

            // Get discussions/Q&A
            $discussions = TrainingDiscussion::where('module_id', $id)
                ->with('user', 'answeredBy')
                ->orderByDesc('is_pinned')
                ->orderByDesc('created_at')
                ->get();

            return Inertia::render('Admin/TrainingProgramDetail', [
                'program' => [
                    'id' => $program->id,
                    'title' => $program->title,
                    'description' => $program->description,
                    'category' => $program->category,
                    'duration_minutes' => $program->duration_minutes,
                    'passing_grade' => $program->passing_grade,
                    'is_active' => $program->is_active,
                    'expiry_date' => $program->expiry_date,
                    'allow_retake' => $program->allow_retake,
                    'max_retake_attempts' => $program->max_retake_attempts,
                    'instructor_id' => $program->instructor_id,
                    'instructor_name' => isset($program->instructor_id) && $program->instructor ? $program->instructor->name : 'Tidak Ditugaskan',
                    'target_departments' => $program->target_departments ?? [],
                    'certificate_template' => $program->certificate_template,
                    'prerequisite_module_id' => $program->prerequisite_module_id,
                    'prerequisite_module_title' => $prerequisiteModule?->title,
                    'created_at' => $program->created_at,
                    'updated_at' => $program->updated_at,
                ],
                'materials' => $materials,
                'questions' => $program->questions->map(function($q) {
                    // Ensure options is treated as array
                    $opts = is_array($q->options) ? $q->options : (is_string($q->options) ? json_decode($q->options, true) : []);
                    
                    return [
                        'id' => $q->id,
                        'text' => $q->question_text,
                        'type' => $q->question_type,
                        'difficulty' => $q->difficulty,
                        'explanation' => $q->explanation,
                        'correct_answer' => $q->correct_answer, // Include correct answer for admin view
                        'image_url' => $q->image_url,
                        'options' => $opts, // Include the JSON options array for frontend compatibility
                        
                        // Fallback logic: Check legacy columns first, then JSON options
                        'option_a' => $q->option_a ?? ($opts[0]['text'] ?? null),
                        'option_b' => $q->option_b ?? ($opts[1]['text'] ?? null),
                        'option_c' => $q->option_c ?? ($opts[2]['text'] ?? null),
                        'option_d' => $q->option_d ?? ($opts[3]['text'] ?? null),
                    ];
                }),
                'stats' => [
                    'enrollment_count' => $enrollmentCount,
                    'completion_count' => $completionCount,
                    'completion_rate' => $completionRate,
                ],
                'learnerProgress' => $learnerProgress,
                'discussions' => $discussions,
                'auth' => ['user' => (array) $user],
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            // If the program was not found, return 404
            abort(404, 'Program not found');
        } catch (\Exception $e) {
            Log::error('Training Program Detail Error: ' . $e->getMessage());
            abort(500, 'Error loading training program');
        }
    }

    /**
     * Update training program
     */
    public function update(Request $request, $id)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        try {
            $module = Module::findOrFail($id);

            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'duration_minutes' => 'required|integer|min:1',
                'passing_grade' => 'required|integer|min:0|max:100',
                'category' => 'nullable|string|max:255',
                'is_active' => 'boolean',
                'allow_retake' => 'boolean',
                'max_retake_attempts' => 'nullable|integer|min:1',
                'expiry_date' => 'nullable|date',
                'prerequisite_module_id' => 'nullable|exists:modules,id',
                'instructor_id' => 'nullable|exists:users,id',
                'certificate_template' => 'nullable|string',
                'pretest_duration' => 'nullable|integer|min:1',
                'posttest_duration' => 'nullable|integer|min:1',
            ]);

            $module->update([
                ...$validated,
            ]);

            // If admin provided new durations, update corresponding quizzes
            // Update quizzes if admin provided duration in either accepted field name
            $preDurationToUpdate = $validated['pretest_duration'] ?? $validated['pretest_duration_minutes'] ?? null;
            $postDurationToUpdate = $validated['posttest_duration'] ?? $validated['posttest_duration_minutes'] ?? null;

            if ($preDurationToUpdate !== null) {
                \App\Models\Quiz::where('module_id', $module->id)->where('type', 'pretest')->update(['time_limit' => intval($preDurationToUpdate)]);
            }
            if ($postDurationToUpdate !== null) {
                \App\Models\Quiz::where('module_id', $module->id)->where('type', 'posttest')->update(['time_limit' => intval($postDurationToUpdate)]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Program pelatihan berhasil diperbarui',
                'data' => $module,
            ]);
        } catch (\Exception $e) {
            Log::error('Update Training Program Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error memperbarui program pelatihan',
            ], 500);
        }
    }

    /**
     * Delete training program
     */
    public function destroy($id)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        try {
            $module = Module::find($id);
            
            if (!$module) {
                return response()->json([
                    'success' => false,
                    'message' => 'Program pelatihan tidak ditemukan',
                ], 404);
            }
            
            // Disable foreign key constraints (works with MySQL, PostgreSQL, SQLite)
            Schema::disableForeignKeyConstraints();
            
            DB::beginTransaction();
            try {
                // Delete related records first
                DB::table('module_assignments')->where('module_id', $id)->delete();
                DB::table('user_trainings')->where('module_id', $id)->delete();
                DB::table('training_discussions')->where('module_id', $id)->delete();
                DB::table('program_approvals')->where('module_id', $id)->delete();
                DB::table('compliance_evidences')->where('module_id', $id)->delete();
                DB::table('program_notifications')->where('module_id', $id)->delete();
                DB::table('program_enrollment_metrics')->where('module_id', $id)->delete();
                DB::table('exam_attempts')->where('module_id', $id)->delete();
                
                // Delete user exam answers
                DB::table('user_exam_answers')->whereIn('exam_attempt_id', 
                    DB::table('exam_attempts')->where('module_id', $id)->pluck('id')
                )->delete();
                
                // Delete materials and their files
                $materials = DB::table('training_materials')->where('module_id', $id)->get();
                foreach ($materials as $material) {
                    if ($material->file_path && Storage::disk('public')->exists($material->file_path)) {
                        Storage::disk('public')->delete($material->file_path);
                    }
                }
                DB::table('training_materials')->where('module_id', $id)->delete();
                
                // Delete questions
                DB::table('questions')->where('module_id', $id)->delete();
                
                // Delete module directly using query builder to bypass Eloquent constraints
                DB::table('modules')->where('id', $id)->delete();
                
                DB::commit();
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

            // Re-enable foreign key constraints
            Schema::enableForeignKeyConstraints();

            return response()->json([
                'success' => true,
                'message' => 'Program pelatihan berhasil dihapus',
            ]);
        } catch (\Exception $e) {
            Schema::enableForeignKeyConstraints();
            Log::error('Delete Training Program Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error menghapus program pelatihan: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Duplicate training program
     */
    public function duplicate($id)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        try {
            $original = Module::with('questions')->findOrFail($id);

            // Create duplicate
            $duplicate = $original->replicate();
            $duplicate->title = $original->title . ' (Copy)';
            $duplicate->is_active = false;
            $duplicate->save();

            // Copy questions
            foreach ($original->questions as $question) {
                $duplicateQuestion = $question->replicate();
                $duplicateQuestion->module_id = $duplicate->id;
                $duplicateQuestion->save();
            }

            return response()->json([
                'success' => true,
                'message' => 'Program berhasil diduplikasi',
                'data' => $duplicate,
            ]);
        } catch (\Exception $e) {
            Log::error('Duplicate Training Program Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error menduplikasi program',
            ], 500);
        }
    }

    /**
     * Batch update status
     */
    public function bulkUpdateStatus(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        try {
            $validated = $request->validate([
                'module_ids' => 'required|array',
                'module_ids.*' => 'exists:modules,id',
                'is_active' => 'required|boolean',
            ]);

            Module::whereIn('id', $validated['module_ids'])
                ->update(['is_active' => $validated['is_active']]);

            return response()->json([
                'success' => true,
                'message' => 'Status program berhasil diperbarui',
            ]);
        } catch (\Exception $e) {
            Log::error('Batch Update Status Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error memperbarui status',
            ], 500);
        }
    }

    /**
     * Batch delete programs
     */
    public function bulkDelete(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        try {
            $validated = $request->validate([
                'module_ids' => 'required|array',
                'module_ids.*' => 'exists:modules,id',
            ]);

            Module::whereIn('id', $validated['module_ids'])->delete();

            return response()->json([
                'success' => true,
                'message' => 'Program berhasil dihapus',
            ]);
        } catch (\Exception $e) {
            Log::error('Batch Delete Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error menghapus program',
            ], 500);
        }
    }

    /**
     * Upload training material
     */
    public function uploadMaterial(Request $request, $id)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        try {
            Module::findOrFail($id);

            $request->validate([
                'file' => 'required|file|max:102400',
                'title' => 'required|string|max:255',
                'material_type' => 'sometimes|string',
                'description' => 'sometimes|string',
                'duration_minutes' => 'nullable|integer|min:0',
            ]);

            $file = $request->file('file');
            $filename = time() . '_' . $file->getClientOriginalName();
            $filepath = $file->storeAs('training-materials', $filename, 'public');
            
            // Convert to PDF if Office file
            $pdfPath = null;
            $extension = $file->getClientOriginalExtension();
            $converter = new PdfConverterService();
            
            if ($converter->needsConversion($extension)) {
                $fullInputPath = storage_path('app/public/' . $filepath);
                $outputDir = storage_path('app/public/training-materials/pdf');
                
                Log::info("Converting uploaded file to PDF", ['input' => $fullInputPath]);
                $pdfFullPath = $converter->convertToPdf($fullInputPath, $outputDir);
                
                if ($pdfFullPath) {
                    $pdfPath = 'training-materials/pdf/' . basename($pdfFullPath);
                    Log::info("PDF conversion successful", ['pdf_path' => $pdfPath]);
                }
            }

            // Map material_type to file_type
            $fileType = $request->material_type ?? 'document';
            
            $material = TrainingMaterial::create([
                'module_id' => $id,
                'title' => $request->title,
                'description' => $request->description ?? '',
                'file_type' => $fileType,
                'file_path' => $filepath,
                'pdf_path' => $pdfPath,
                'file_name' => $file->getClientOriginalName(),
                'file_size' => $file->getSize(),
                'duration_minutes' => $request->duration_minutes ?? 0,
                'order' => TrainingMaterial::where('module_id', $id)->max('order') + 1 ?? 0,
                'uploaded_by' => $user->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Materi berhasil diunggah' . ($pdfPath ? ' dan dikonversi ke PDF' : ''),
                'data' => [
                    'id' => $material->id,
                    'title' => $material->title,
                    'description' => $material->description,
                    'file_type' => $material->file_type,
                    'file_path' => $material->file_path,
                    'pdf_path' => $material->pdf_path,
                    'file_name' => $material->file_name,
                    'file_size' => $material->file_size,
                    'duration_minutes' => $material->duration_minutes,
                    'material_type' => $material->file_type,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Material Upload Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error mengunggah materi',
            ], 500);
        }
    }

    /**
     * Delete training material
     */
    public function deleteMaterial($id)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        try {
            $material = TrainingMaterial::findOrFail($id);
            
            // Delete original file
            Storage::disk('public')->delete($material->file_path);
            
            // Delete PDF version if exists
            if ($material->pdf_path) {
                Storage::disk('public')->delete($material->pdf_path);
            }
            
            $material->delete();

            return response()->json([
                'success' => true,
                'message' => 'Materi berhasil dihapus',
            ]);
        } catch (\Exception $e) {
            Log::error('Delete Material Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error menghapus materi',
            ], 500);
        }
    }

    /**
     * Add question to training program
     */
    public function addQuestion(Request $request, $id)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        try {
            Module::findOrFail($id);

            $validated = $request->validate([
                'question_text' => 'required|string',
                'option_a' => 'required|string',
                'option_b' => 'required|string',
                'option_c' => 'required|string',
                'option_d' => 'required|string',
                'correct_answer' => 'required|in:a,b,c,d',
                'difficulty' => 'required|in:easy,medium,hard',
                // Allow either multiple_choice/true_false/short_answer OR pretest/posttest for compatibility
                'question_type' => 'required|string',
                'explanation' => 'nullable|string',
                'image_url' => 'sometimes|nullable|image|max:5120',
            ]);

            // Handle image upload if provided
            $imageUrl = null;
            if ($request->hasFile('image_url') && $request->file('image_url')->isValid()) {
                $image = $request->file('image_url');
                $imageFilename = time() . '_question_' . uniqid() . '.' . $image->getClientOriginalExtension();
                $path = $image->storeAs('public/questions', $imageFilename);
                if (Storage::exists('public/questions/' . $imageFilename)) {
                    $imageUrl = 'storage/questions/' . $imageFilename;
                }
            }

            // Normalize options and save both JSON and legacy fields
            $normalizedOptions = [
                ['label' => 'a', 'text' => ($validated['option_a'] ?? null)],
                ['label' => 'b', 'text' => ($validated['option_b'] ?? null)],
                ['label' => 'c', 'text' => ($validated['option_c'] ?? null)],
                ['label' => 'd', 'text' => ($validated['option_d'] ?? null)],
            ];

            $questionData = [
                'module_id' => $id,
                'question_text' => $validated['question_text'],
                'options' => $normalizedOptions,
                'correct_answer' => $validated['correct_answer'],
                'difficulty' => $validated['difficulty'],
                'question_type' => $validated['question_type'],
                'explanation' => $validated['explanation'] ?? null,
                'image_url' => $imageUrl,
            ];

            if (Schema::hasColumn('questions', 'option_a')) {
                $questionData['option_a'] = $validated['option_a'] ?? null;
                $questionData['option_b'] = $validated['option_b'] ?? null;
                $questionData['option_c'] = $validated['option_c'] ?? null;
                $questionData['option_d'] = $validated['option_d'] ?? null;
            }

            $question = Question::create($questionData);

            return response()->json([
                'success' => true,
                'message' => 'Pertanyaan berhasil ditambahkan',
                'data' => $question,
            ]);
        } catch (\Exception $e) {
            Log::error('Add Question Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error menambahkan pertanyaan',
            ], 500);
        }
    }

    /**
     * Update question
     */
    public function updateQuestion(Request $request, $id)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        try {
            $question = Question::findOrFail($id);

            $validated = $request->validate([
                'question_text' => 'required|string',
                'option_a' => 'required|string',
                'option_b' => 'required|string',
                'option_c' => 'required|string',
                'option_d' => 'required|string',
                'correct_answer' => 'required|in:a,b,c,d',
                'difficulty' => 'required|in:easy,medium,hard',
                'question_type' => 'required|string',
                'explanation' => 'nullable|string',
                'image_url' => 'sometimes|nullable|image|max:5120',
            ]);

            // Handle optional image upload
            $imageUrl = $question->image_url;
            if ($request->hasFile('image_url') && $request->file('image_url')->isValid()) {
                $image = $request->file('image_url');
                $imageFilename = time() . '_question_' . uniqid() . '.' . $image->getClientOriginalExtension();
                $path = $image->storeAs('public/questions', $imageFilename);
                if (Storage::exists('public/questions/' . $imageFilename)) {
                    $imageUrl = 'storage/questions/' . $imageFilename;
                }
            }

            // Normalize options and update both legacy option columns and JSON options
            $normalizedOptions = [
                ['label' => 'a', 'text' => ($validated['option_a'] ?? null)],
                ['label' => 'b', 'text' => ($validated['option_b'] ?? null)],
                ['label' => 'c', 'text' => ($validated['option_c'] ?? null)],
                ['label' => 'd', 'text' => ($validated['option_d'] ?? null)],
            ];

            $question->update(array_merge($validated, [
                'options' => $normalizedOptions,
                'image_url' => $imageUrl,
            ]));

            return response()->json([
                'success' => true,
                'message' => 'Pertanyaan berhasil diperbarui',
                'data' => $question,
            ]);
        } catch (\Exception $e) {
            Log::error('Update Question Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error memperbarui pertanyaan',
            ], 500);
        }
    }

    /**
     * Delete question
     */
    public function deleteQuestion($id)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        try {
            Question::findOrFail($id)->delete();

            return response()->json([
                'success' => true,
                'message' => 'Pertanyaan berhasil dihapus',
            ]);
        } catch (\Exception $e) {
            Log::error('Delete Question Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error menghapus pertanyaan',
            ], 500);
        }
    }

    /**
     * Assign training to users
     */
    public function assignUsers(Request $request, $id)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        try {
            Module::findOrFail($id);

            $validated = $request->validate([
                'user_ids' => 'nullable|array',
                'user_ids.*' => 'exists:users,id',
                'departments' => 'nullable|array',
                'due_date' => 'nullable|date',
            ]);

            $assignedCount = 0;

            // Assign to specific users (hanya tambah yang belum ada)
            if (!empty($validated['user_ids'])) {
                foreach ($validated['user_ids'] as $userId) {
                    if ($this->assignUserToModule($id, $userId, $validated['due_date'] ?? null)) {
                        $assignedCount++;
                    }
                }
            }

            // Assign to departments (hanya tambah yang belum ada)
            if (!empty($validated['departments'])) {
                $users = User::whereIn('department', $validated['departments'])->pluck('id');
                foreach ($users as $userId) {
                    if ($this->assignUserToModule($id, $userId, $validated['due_date'] ?? null)) {
                        $assignedCount++;
                    }
                }
            }

            return response()->json([
                'success' => true,
                'message' => "Training berhasil ditetapkan ke {$assignedCount} user",
            ]);
        } catch (\Exception $e) {
            Log::error('Assign Training Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error menetapkan training',
            ], 500);
        }
    }

    /**
     * Helper: Assign single user to module (creates both ModuleAssignment and UserTraining)
     */
    private function assignUserToModule($moduleId, $userId, $dueDate = null)
    {
        // Cek apakah user sudah di-assign sebelumnya di ModuleAssignment
        $existingAssignment = ModuleAssignment::where('module_id', $moduleId)
            ->where('user_id', $userId)
            ->first();
        
        if ($existingAssignment) {
            return false; // Already assigned
        }

        // Create ModuleAssignment record
        ModuleAssignment::create([
            'module_id' => $moduleId,
            'user_id' => $userId,
            'assigned_date' => now(),
            'due_date' => $dueDate,
            'status' => 'pending',
        ]);

        // Also create UserTraining record so it appears on user's dashboard
        // UserTraining status: enrolled, in_progress, completed, failed
        $existingUserTraining = UserTraining::where('module_id', $moduleId)
            ->where('user_id', $userId)
            ->first();

        if (!$existingUserTraining) {
            UserTraining::create([
                'user_id' => $userId,
                'module_id' => $moduleId,
                'status' => 'enrolled',
                'final_score' => null,
                'is_certified' => false,
                'enrolled_at' => now(),
                'completed_at' => null,
            ]);
        }

        return true;
    }

    /**
     * Get assigned users for a program
     */
    public function getAssignedUsers($id)
    {
        try {
            $assignments = ModuleAssignment::where('module_id', $id)
                ->with('user:id,name,email,department')
                ->get()
                ->map(function($assignment) {
                    return [
                        'id' => $assignment->id,
                        'user_id' => $assignment->user_id,
                        'user_name' => $assignment->user->name ?? 'Unknown User',
                        'user_email' => $assignment->user->email ?? '',
                        'department' => $assignment->user->department ?? $assignment->department,
                        'assigned_date' => $assignment->assigned_date,
                        'due_date' => $assignment->due_date,
                        'status' => $assignment->status ?? 'not_started',
                        'completion_percentage' => 0,
                        'priority' => 'normal'
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $assignments,
            ]);
        } catch (\Exception $e) {
            Log::error('Get Assigned Users Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error mengambil data pengguna',
            ], 500);
        }
    }

    /**
     * Remove assigned users from a program
     */
    public function removeAssignedUsers($id, Request $request)
    {
        try {
            $validated = $request->validate([
                'user_ids' => 'required|array',
                'user_ids.*' => 'integer|exists:users,id',
                'force' => 'nullable|boolean' // Force delete even if in_progress/completed
            ]);

            $forceDelete = $validated['force'] ?? true; // Default to force delete

            // Remove from ModuleAssignment
            ModuleAssignment::where('module_id', $id)
                ->whereIn('user_id', $validated['user_ids'])
                ->delete();

            // Remove from UserTraining
            // If force = true, delete regardless of status
            // If force = false, only delete if status = enrolled
            $query = UserTraining::where('module_id', $id)
                ->whereIn('user_id', $validated['user_ids']);
            
            if (!$forceDelete) {
                $query->where('status', 'enrolled');
            }
            
            $deletedCount = $query->delete();

            return response()->json([
                'success' => true,
                'message' => "User berhasil dihapus dari program ({$deletedCount} record)",
            ]);
        } catch (\Exception $e) {
            Log::error('Remove Assigned Users Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error menghapus user',
            ], 500);
        }
    }

    /**
     * Get Analytics data for Training Programs
     */
    public function getAnalytics(Request $request)
    {
        try {
            $range = $request->query('range', 30);
            $startDate = now()->subDays($range);

            // Top performing programs
            $topPrograms = Module::where('is_active', true)
                ->select('id', 'title')
                ->get()
                ->map(function($module) {
                    $enrollmentCount = DB::table('user_trainings')
                        ->where('module_id', $module->id)
                        ->count();
                    $completionCount = DB::table('user_trainings')
                        ->where('module_id', $module->id)
                        ->where('is_completed', true)
                        ->count();
                    $avgScore = DB::table('exam_attempts')
                        ->whereHas('userTraining', function($q) use ($module) {
                            $q->where('module_id', $module->id);
                        })
                        ->where('is_passed', true)
                        ->avg('percentage') ?? 0;

                    return [
                        'program_name' => $module->title,
                        'enrollments' => $enrollmentCount,
                        'completions' => $completionCount,
                        'completion_rate' => $enrollmentCount > 0 ? round(($completionCount / $enrollmentCount) * 100, 1) : 0,
                        'avg_score' => round($avgScore, 1),
                    ];
                })
                ->sortByDesc('completion_rate')
                ->take(10)
                ->values();

            // Enrollment trends (last 30 days)
            $enrollmentTrends = [];
            for ($i = $range - 1; $i >= 0; $i--) {
                $date = now()->subDays($i);
                $count = DB::table('user_trainings')
                    ->whereDate('enrolled_at', $date->format('Y-m-d'))
                    ->count();
                
                $enrollmentTrends[] = [
                    'date' => $date->format('M d'),
                    'enrollments' => $count,
                ];
            }

            // Completion rate by category
            $categoryStats = Module::select('category')
                ->where('is_active', true)
                ->whereNotNull('category')
                ->distinct()
                ->get()
                ->map(function($module) {
                    $completions = DB::table('user_trainings')
                        ->join('modules', 'user_trainings.module_id', '=', 'modules.id')
                        ->where('modules.category', $module->category)
                        ->where('user_trainings.status', 'completed')
                        ->count();
                    
                    $total = DB::table('user_trainings')
                        ->join('modules', 'user_trainings.module_id', '=', 'modules.id')
                        ->where('modules.category', $module->category)
                        ->count();

                    return [
                        'category' => $module->category,
                        'completion_rate' => $total > 0 ? round(($completions / $total) * 100, 1) : 0,
                        'total_enrollments' => $total,
                    ];
                })
                ->sortByDesc('completion_rate')
                ->values();

            return response()->json([
                'top_programs' => $topPrograms,
                'enrollment_trends' => $enrollmentTrends,
                'category_stats' => $categoryStats,
            ]);
        } catch (\Exception $e) {
            Log::error('Get Analytics Error: ' . $e->getMessage());
            return response()->json(['error' => 'Error loading analytics'], 500);
        }
    }

    /**
     * Get Reports data for Training Programs
     */
    public function getReports(Request $request)
    {
        try {
            // Overall statistics
            $totalEnrollments = DB::table('user_trainings')->count();
            $totalCompletions = DB::table('user_trainings')
                ->where('status', 'completed')
                ->count();
            $avgCompletionRate = $totalEnrollments > 0 
                ? round(($totalCompletions / $totalEnrollments) * 100, 1) 
                : 0;

            // Users by completion status
            $completionStatus = [
                [
                    'status' => 'Completed',
                    'count' => $totalCompletions,
                    'percentage' => $avgCompletionRate,
                    'color' => '#10B981'
                ],
                [
                    'status' => 'In Progress',
                    'count' => DB::table('user_trainings')
                        ->where('status', '!=', 'completed')
                        ->count(),
                    'percentage' => 100 - $avgCompletionRate,
                    'color' => '#F59E0B'
                ]
            ];

            // Department-wise performance
            $departmentPerformance = User::where('role', 'user')
                ->select('department')
                ->whereNotNull('department')
                ->distinct()
                ->get()
                ->map(function($user) {
                    $deptUsers = User::where('department', $user->department)
                        ->where('role', 'user')
                        ->pluck('id');
                    
                    $completions = DB::table('user_trainings')
                        ->whereIn('user_id', $deptUsers)
                        ->where('status', 'completed')
                        ->count();
                    
                    $total = DB::table('user_trainings')
                        ->whereIn('user_id', $deptUsers)
                        ->count();

                    return [
                        'department' => $user->department,
                        'completion_rate' => $total > 0 ? round(($completions / $total) * 100, 1) : 0,
                        'total_enrollments' => $total,
                        'total_completed' => $completions,
                    ];
                })
                ->sortByDesc('completion_rate')
                ->values();

            // Score distribution
            $avgScores = DB::table('exam_attempts')
                ->where('is_passed', true)
                ->pluck('percentage');
            
            $scoreDistribution = [
                'avg_score' => $avgScores->count() > 0 ? round($avgScores->avg(), 1) : 0,
                'highest_score' => $avgScores->count() > 0 ? $avgScores->max() : 0,
                'lowest_score' => $avgScores->count() > 0 ? $avgScores->min() : 0,
            ];

            return response()->json([
                'overall_stats' => [
                    'total_enrollments' => $totalEnrollments,
                    'total_completions' => $totalCompletions,
                    'avg_completion_rate' => $avgCompletionRate,
                ],
                'completion_status' => $completionStatus,
                'department_performance' => $departmentPerformance,
                'score_distribution' => $scoreDistribution,
            ]);
        } catch (\Exception $e) {
            Log::error('Get Reports Error: ' . $e->getMessage());
            return response()->json(['error' => 'Error loading reports'], 500);
        }
    }

    /**
     * Get Compliance data for Training Programs
     */
    public function getCompliance(Request $request)
    {
        try {
            // Mandatory training status
            $mandatoryTrainings = Module::where('category', 'Compliance')
                ->where('is_active', true)
                ->select('id', 'title')
                ->get()
                ->map(function($module) {
                    $enrollmentCount = DB::table('user_trainings')
                        ->where('module_id', $module->id)
                        ->count();
                    $completionCount = DB::table('user_trainings')
                        ->where('module_id', $module->id)
                        ->where('is_completed', true)
                        ->count();
                    
                    $notCompleted = User::where('role', 'user')
                        ->whereNotIn('id', function($q) use ($module) {
                            $q->select('user_id')
                                ->from('user_trainings')
                                ->where('module_id', $module->id)
                                ->where('is_completed', true);
                        })
                        ->count();

                    return [
                        'training_name' => $module->title,
                        'total_users' => User::where('role', 'user')->count(),
                        'completed_users' => $completionCount,
                        'not_completed_users' => $notCompleted,
                        'compliance_rate' => User::where('role', 'user')->count() > 0 
                            ? round(($completionCount / User::where('role', 'user')->count()) * 100, 1)
                            : 0,
                    ];
                })
                ->sortByDesc('compliance_rate')
                ->values();

            // Non-compliant users (haven't completed mandatory trainings)
            $nonCompliantUsers = User::where('role', 'user')
                ->select('id', 'name', 'email', 'department')
                ->get()
                ->map(function($user) {
                    $incompleteMandatory = DB::table('user_trainings')
                        ->join('modules', 'user_trainings.module_id', '=', 'modules.id')
                        ->where('user_trainings.user_id', $user->id)
                        ->where('modules.category', 'Compliance')
                        ->where('user_trainings.status', '!=', 'completed')
                        ->count();

                    $riskScore = $incompleteMandatory > 0 ? round((min($incompleteMandatory, 5) / 5) * 100, 1) : 0;

                    return [
                        'user_id' => $user->id,
                        'user_name' => $user->name,
                        'email' => $user->email,
                        'department' => $user->department,
                        'incomplete_mandatory' => $incompleteMandatory,
                        'risk_score' => $riskScore,
                    ];
                })
                ->where('incomplete_mandatory', '>', 0)
                ->sortByDesc('risk_score')
                ->take(20)
                ->values();

            // Compliance summary
            $allUsers = User::where('role', 'user')->count();
            $fullyCompliant = User::where('role', 'user')
                ->get()
                ->filter(function($user) {
                    return DB::table('user_trainings')
                        ->join('modules', 'user_trainings.module_id', '=', 'modules.id')
                        ->where('user_trainings.user_id', $user->id)
                        ->where('modules.category', 'Compliance')
                        ->where('user_trainings.is_completed', false)
                        ->count() === 0;
                })
                ->count();

            return response()->json([
                'mandatory_trainings' => $mandatoryTrainings,
                'non_compliant_users' => $nonCompliantUsers,
                'compliance_summary' => [
                    'total_users' => $allUsers,
                    'fully_compliant' => $fullyCompliant,
                    'at_risk' => $allUsers - $fullyCompliant,
                    'compliance_percentage' => $allUsers > 0 ? round(($fullyCompliant / $allUsers) * 100, 1) : 0,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Get Compliance Error: ' . $e->getMessage());
            return response()->json(['error' => 'Error loading compliance data'], 500);
        }
    }

    /**
     * Remove users from a training program
     */
    public function removeUsers(Request $request, $id)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        try {
            Module::findOrFail($id);

            $validated = $request->validate([
                'user_ids' => 'required|array',
                'user_ids.*' => 'exists:users,id',
            ]);

            // Remove specific user assignments from ModuleAssignment
            ModuleAssignment::where('module_id', $id)
                ->whereIn('user_id', $validated['user_ids'])
                ->delete();

            // ALSO remove from UserTraining to fully revoke access
            UserTraining::where('module_id', $id)
                ->whereIn('user_id', $validated['user_ids'])
                ->delete();

            return response()->json([
                'success' => true,
                'message' => 'User berhasil dihapus dari training',
            ]);
        } catch (\Exception $e) {
            Log::error('Remove Users Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error menghapus user dari training',
            ], 500);
        }
    }

    /**
     * Send reminder email to user about training
     */
    public function sendReminder(Request $request, $id)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        try {
            $module = Module::findOrFail($id);
            
            $validated = $request->validate([
                'user_id' => 'required|exists:users,id',
            ]);

            $targetUser = User::findOrFail($validated['user_id']);

            // Check if user is assigned to this module
            $assignment = ModuleAssignment::where('module_id', $id)
                ->where('user_id', $validated['user_id'])
                ->first();

            if (!$assignment) {
                return response()->json([
                    'success' => false,
                    'message' => 'User tidak ditetapkan untuk training ini',
                ], 404);
            }

            // Send reminder email
            try {
                Mail::raw(
                    "Halo {$targetUser->name},\n\n"
                    . "Ini adalah pengingat bahwa Anda telah ditetapkan untuk training: {$module->title}\n"
                    . "Durasi: {$module->duration_minutes} menit\n"
                    . "Target Nilai: {$module->passing_grade}%\n\n"
                    . "Silakan mulai training Anda segera.\n\n"
                    . "Terima kasih,\n"
                    . "HCMS Learning Center",
                    function ($message) use ($targetUser, $module) {
                        $message->to($targetUser->email)
                            ->subject("Reminder: Training {$module->title}");
                    }
                );
            } catch (\Exception $mailError) {
                Log::warning('Mail Error: ' . $mailError->getMessage());
                // Continue even if email fails
            }

            // Log the reminder activity
            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'send_reminder',
                'entity_type' => 'Module',
                'entity_id' => $id,
                'changes' => [
                    'reminded_user' => $targetUser->name,
                    'reminded_email' => $targetUser->email,
                    'module' => $module->title,
                ],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Reminder berhasil dikirim ke ' . $targetUser->email,
            ]);
        } catch (\Exception $e) {
            Log::error('Send Reminder Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error mengirim reminder: ' . $e->getMessage(),
            ], 500);
        }
    }
}
