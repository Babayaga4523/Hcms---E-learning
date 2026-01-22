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
            $query = Module::select('id', 'title', 'description', 'is_active', 'passing_grade', 'duration_minutes', 'category', 'cover_image', 'expiry_date', 'created_at');

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

            $programs = $query->paginate(15)->through(function($module) {
                // Calculate counts manually
                $totalQuestions = $module->questions()->count();
                $enrollmentCount = $module->userTrainings()->count();
                $completionCount = $module->userTrainings()->where('status', 'completed')->count();
                
                // Calculate completion rate
                $completionRate = $enrollmentCount > 0 
                    ? round(($completionCount / $enrollmentCount) * 100, 2) 
                    : 0;

                $programData = [
                    'id' => $module->id,
                    'title' => $module->title,
                    'description' => $module->description,
                    'duration_minutes' => $module->duration_minutes ?? 60,
                    'is_active' => $module->is_active,
                    'passing_grade' => $module->passing_grade,
                    'category' => $module->category ?? null,
                    'cover_image' => $module->cover_image ?? null,
                    'total_questions' => $totalQuestions,
                    'enrollment_count' => $enrollmentCount,
                    'completion_count' => $completionCount,
                    'completion_rate' => $completionRate,
                    'expiry_date' => $module->expiry_date ?? null,
                    'created_at' => $module->created_at,
                    'status' => $module->is_active ? 'Aktif' : 'Nonaktif',
                ];

                Log::info('Processing program for frontend:', ['id' => $module->id, 'title' => $module->title, 'is_active' => $module->is_active]);

                return $programData;
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
                'programs' => $programs->items(),
                'pagination' => [
                    'current_page' => $programs->currentPage(),
                    'last_page' => $programs->lastPage(),
                    'per_page' => $programs->perPage(),
                    'total' => $programs->total(),
                ],
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

        // Debug: Inspect incoming request for tests
        try {
            Log::info("TOP-REQUEST-ALL: " . json_encode($request->all()));
            $fileKeys = array_keys($request->files->all());
            Log::info("FILES KEYS: " . json_encode($fileKeys));
        } catch (\Exception $e) {
            Log::info('Could not dump request for debugging: ' . $e->getMessage());
        }

        // 1. Validation (Security & Data Integrity)
        // Check if this is a draft submission
        $isDraft = $request->has('is_draft') && $request->boolean('is_draft');

        // Prevent dual format questions to avoid confusion and duplication
        $hasUnifiedQuestions = $request->has('questions') && is_array($request->questions) && count($request->questions) > 0;
        $hasSeparateQuestions = ($request->has('pre_test_questions') && is_array($request->pre_test_questions)) ||
                               ($request->has('post_test_questions') && is_array($request->post_test_questions));

        if ($hasUnifiedQuestions && $hasSeparateQuestions) {
            return response()->json([
                'success' => false,
                'message' => 'Gunakan format questions ATAU pre_test_questions/post_test_questions, jangan keduanya secara bersamaan'
            ], 422);
        }

        // Define allowed categories for BNI Finance
        $allowedCategories = [
            'Core Business & Product',
            'Credit & Risk Management',
            'Collection & Recovery',
            'Compliance & Regulatory',
            'Sales & Marketing',
            'Service Excellence',
            'Leadership & Soft Skills',
            'IT & Digital Security',
            'Onboarding'
        ];

        $request->validate([
            'title' => $isDraft ? 'nullable|string|max:255' : 'required|string|max:255',
            'description' => $isDraft ? 'nullable|string' : 'required|string',
            'duration_minutes' => $isDraft ? 'nullable|integer|min:1' : 'required|integer|min:1',
            'passing_grade' => 'nullable|integer|min:0',
            'category' => $isDraft ? 'nullable|string' : ['required', 'string', \Illuminate\Validation\Rule::in($allowedCategories)],
            'is_active' => 'boolean',
            'allow_retake' => 'boolean',
            'max_retake_attempts' => 'nullable|integer|min:1',
            'expiry_date' => 'nullable|date',
            'prerequisite_module_id' => 'nullable|exists:modules,id',
            'instructor_id' => 'nullable|exists:users,id',
            'certificate_template' => 'nullable|string',
            'xp' => 'nullable|integer|min:0',
            'cover_image' => 'sometimes|nullable|image|mimes:jpg,jpeg,png,webp|max:5120', // Cover image max 5MB
            // Validasi Array Materials - More specific MIME types
            'materials.*.file' => 'sometimes|nullable|file|mimes:pdf,mp4,doc,docx,ppt,pptx,xls,xlsx,jpg,jpeg,png|max:20480', // Max 20MB
            'materials.*.title' => 'required|string',
            'materials.*.description' => 'nullable|string',
            'materials.*.duration' => 'nullable|integer|min:0',
            'materials.*.order' => 'nullable|integer|min:0',
            // Validasi Array Questions (Unified format) - DEPRECATED but kept for backward compatibility
            'questions.*.question_text' => 'nullable|string',
            'questions.*.question_type' => 'nullable|in:pretest,posttest',
            'questions.*.option_a' => 'nullable|string',
            'questions.*.option_b' => 'nullable|string',
            'questions.*.option_c' => 'nullable|string',
            'questions.*.option_d' => 'nullable|string',
            'questions.*.correct_answer' => 'nullable|in:a,b,c,d',
            'questions.*.explanation' => 'nullable|string',
            'questions.*.image_url' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120', // More specific image types
            // New: quiz time limits in minutes
            'pretest_duration' => 'nullable|integer|min:1',
            'posttest_duration' => 'nullable|integer|min:1',
            // Also accept frontend field names with _minutes suffix for compatibility
            'pretest_duration_minutes' => 'nullable|integer|min:1',
            'posttest_duration_minutes' => 'nullable|integer|min:1',
            // Alternative format: separate pre/post test questions - RECOMMENDED FORMAT
            'pre_test_questions.*.question_text' => 'nullable|string',
            'pre_test_questions.*.option_a' => 'nullable|string',
            'pre_test_questions.*.option_b' => 'nullable|string',
            'pre_test_questions.*.option_c' => 'nullable|string',
            'pre_test_questions.*.option_d' => 'nullable|string',
            'pre_test_questions.*.correct_answer' => 'nullable|in:a,b,c,d',
            'pre_test_questions.*.explanation' => 'nullable|string',
            'pre_test_questions.*.image_url' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120', // More specific image types
            'post_test_questions.*.question_text' => 'nullable|string',
            'post_test_questions.*.option_a' => 'nullable|string',
            'post_test_questions.*.option_b' => 'nullable|string',
            'post_test_questions.*.option_c' => 'nullable|string',
            'post_test_questions.*.option_d' => 'nullable|string',
            'post_test_questions.*.correct_answer' => 'nullable|in:a,b,c,d',
            'post_test_questions.*.explanation' => 'nullable|string',
            'post_test_questions.*.image_url' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:5120', // More specific image types
        ]);

        // 2. Gunakan Database Transaction
        // Jika satu part gagal, semua dibatalkan (Rollback)
        DB::beginTransaction();
        $uploadedFiles = []; // Track uploaded files for cleanup on rollback

        try {
            // A. Simpan Module / Program Utama
            $module = Module::create([
                'title' => $request->title,
                'description' => $request->description,
                'duration_minutes' => $request->duration_minutes,
                'passing_grade' => $request->passing_grade ?? 0,
                'category' => $request->category ?? null,
                'is_active' => filter_var($request->is_active ?? false, FILTER_VALIDATE_BOOLEAN),
                'allow_retake' => filter_var($request->allow_retake ?? false, FILTER_VALIDATE_BOOLEAN),
                'max_retake_attempts' => $request->allow_retake ? ($request->max_retake_attempts ?? 3) : 0,
                'expiry_date' => $request->expiry_date ?? null,
                'prerequisite_module_id' => $request->prerequisite_module_id ?? null,
                'instructor_id' => $request->instructor_id ?? null,
                'certificate_template' => $request->certificate_template ?? null,
                'xp' => $request->xp ?? 0,
                // Kita update flag ini nanti setelah menghitung soal
                'has_pretest' => false,
                'has_posttest' => false,
            ]);

            // B. Handle Cover Image (optional)
            if ($request->hasFile('cover_image') && $request->file('cover_image')->isValid()) {
                try {
                    $cover = $request->file('cover_image');
                    $coverFilename = time() . '_cover_' . uniqid() . '.' . $cover->getClientOriginalExtension();
                    // store under public disk in training-programs/covers
                    $coverPath = $cover->storeAs('public/training-programs/covers', $coverFilename);
                    $uploadedFiles[] = 'public/training-programs/covers/' . $coverFilename; // track for rollback

                    $publicPath = 'training-programs/covers/' . $coverFilename;
                    /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
                    $disk = Storage::disk('public');
                    if ($disk->exists($publicPath)) {
                        $module->update(['cover_image' => $disk->url($publicPath)]);
                    } else {
                        Log::warning('Cover image saved but not found on public disk', ['path' => $publicPath]);
                    }
                } catch (\Exception $e) {
                    Log::error('Cover image upload failed: ' . $e->getMessage());
                }
            }

            // B. Handle Materials (File Upload and URL links)
            if ($request->has('materials')) {
                foreach ($request->materials as $matData) {
                    // Prefer file upload when provided
                    if (isset($matData['file']) && $matData['file'] instanceof \Illuminate\Http\UploadedFile && $matData['file']->isValid()) {

                        // Buat nama file unik (Future-proof & Security)
                        $filename = time() . '_' . preg_replace('/\s+/', '_', $matData['file']->getClientOriginalName());

                        // Simpan ke storage/app/public/materials
                        $path = $matData['file']->storeAs('public/materials', $filename);
                        $uploadedFiles[] = 'materials/' . $filename; // Track for cleanup

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
                    // Handle base64 encoded files
                    elseif (isset($matData['file']) && is_string($matData['file']) && str_starts_with($matData['file'], 'data:')) {
                        try {
                            $data = explode(',', $matData['file']);
                            $fileData = base64_decode($data[1]);
                            $mime = explode(';', $data[0])[0];
                            $extension = explode('/', $mime)[1];
                            $filename = time() . '_' . uniqid() . '.' . $extension;
                            $path = 'materials/' . $filename;
                            Storage::disk('public')->put($path, $fileData);
                            $uploadedFiles[] = $path;

                            $materialData = [
                                'module_id' => $module->id,
                                'title' => $matData['title'],
                                'description' => $matData['description'] ?? null,
                                'file_path' => $path,
                                'file_name' => $filename,
                                'file_type' => $extension,
                                'file_size' => strlen($fileData),
                                'duration_minutes' => $matData['duration'] ?? 0,
                                'order' => $matData['order'] ?? 0,
                                'uploaded_by' => $user->id,
                            ];

                            if (strtolower($extension) === 'pdf') {
                                $materialData['pdf_path'] = $path;
                            }

                            TrainingMaterial::create($materialData);
                        } catch (\Exception $e) {
                            Log::error('Base64 material upload failed', ['error' => $e->getMessage()]);
                        }
                    }
                    // If no file but a URL is provided, save as external material link
                    elseif (!empty($matData['url']) && filter_var($matData['url'], FILTER_VALIDATE_URL)) {
                        $materialData = [
                            'module_id' => $module->id,
                            'title' => $matData['title'] ?? 'Untitled',
                            'description' => $matData['description'] ?? null,
                            'file_path' => null,
                            'file_name' => basename(parse_url($matData['url'], PHP_URL_PATH)) ?: null,
                            'file_type' => 'url',
                            'file_size' => 0,
                            'duration_minutes' => $matData['duration'] ?? 0,
                            'order' => $matData['order'] ?? 0,
                            'external_url' => $matData['url'],
                            'uploaded_by' => $user->id,
                        ];

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
            // Support file uploads within nested question arrays. Laravel may put files in $request->files rather than in the normal input array.
            $preInput = $request->input('pre_test_questions') ?? [];
            $preFiles = $request->file('pre_test_questions') ?? [];

            try {
                Log::info("PRE_INPUT DUMP: " . print_r($preInput, true));
                Log::info("PRE_FILES DUMP: " . print_r($preFiles, true));
            } catch (\Exception $e) {
                Log::info('Could not dump pre question files: ' . $e->getMessage());
            }

            $maxPre = max(count($preInput ?? []), count($preFiles ?? []));
            for ($i = 0; $i < $maxPre; $i++) {
                $qData = $preInput[$i] ?? [];
                if (isset($preFiles[$i])) {
                    // preFiles[$i] may be an array like ['image_url' => UploadedFile]
                    if (is_array($preFiles[$i]) && isset($preFiles[$i]['image_url'])) {
                        $qData['image_url'] = $preFiles[$i]['image_url'];
                    } elseif ($preFiles[$i] instanceof \Illuminate\Http\UploadedFile) {
                        $qData['image_url'] = $preFiles[$i];
                    }
                }
                if (!empty($qData['question_text'])) {
                    $qData['question_type'] = 'pretest';
                    $allQuestions[] = $qData;
                }
            }

            $postInput = $request->input('post_test_questions') ?? [];
            $postFiles = $request->file('post_test_questions') ?? [];

            $maxPost = max(count($postInput ?? []), count($postFiles ?? []));
            for ($i = 0; $i < $maxPost; $i++) {
                $qData = $postInput[$i] ?? [];
                if (isset($postFiles[$i]) && $postFiles[$i] instanceof \Illuminate\Http\UploadedFile) {
                    $qData['image_url'] = $postFiles[$i];
                }
                if (!empty($qData['question_text'])) {
                    $qData['question_type'] = 'posttest';
                    $allQuestions[] = $qData;
                }
            }

            Log::info('Questions data received:', ['questions' => $allQuestions]);

            if (count($allQuestions) > 0) {
                // Debug: dump first question payload when running tests
                try {
                    if (app()->runningInConsole()) {
                        Log::info("AllQuestions payload: " . print_r(array_slice($allQuestions,0,3), true));
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

                    // Handle Image Upload untuk Question - IMPROVED: Support both direct upload and temp file move
                    $imageUrl = null;

                    // Check for uploaded file in the request using Laravel's file handling
                    if (isset($qData['image_url'])) {
                        Log::info('Image upload data received', [
                            'image_url_type' => gettype($qData['image_url']),
                            'image_url_value' => is_object($qData['image_url']) ? get_class($qData['image_url']) : $qData['image_url'],
                            'is_uploaded_file' => $qData['image_url'] instanceof \Illuminate\Http\UploadedFile,
                            'question_index' => $index
                        ]);

                        if ($qData['image_url'] instanceof \Illuminate\Http\UploadedFile && $qData['image_url']->isValid()) {
                            // Direct upload (legacy support)
                            try {
                                Log::info("LEGACY-UPLOAD-RECEIVED: " . get_class($qData['image_url']) . " name=" . (method_exists($qData['image_url'], 'getClientOriginalName') ? $qData['image_url']->getClientOriginalName() : 'unknown'));
                                $extension = method_exists($qData['image_url'], 'getClientOriginalExtension') ? $qData['image_url']->getClientOriginalExtension() : pathinfo($qData['image_url']->getFilename(), PATHINFO_EXTENSION);
                                $imageFilename = 'quiz_' . $module->id . '_' . time() . '_' . uniqid() . '.' . $extension;
                                // Use storeAs if available, otherwise move the temp file manually
                                if (method_exists($qData['image_url'], 'storeAs')) {
                                    $path = $qData['image_url']->storeAs('public/questions', $imageFilename);
                                    Log::info("STORED USING storeAs, path=" . $path);
                                } else {
                                    // Fallback: move the underlying file into storage
                                    $tmpPath = $qData['image_url']->getPathname();
                                    $target = storage_path('app/public/questions/' . $imageFilename);
                                    if (!is_dir(dirname($target))) {
                                        mkdir(dirname($target), 0755, true);
                                    }
                                    $copied = copy($tmpPath, $target);
                                    Log::info("FALLBACK copy tmpPath=" . $tmpPath . " to " . $target . " result=" . ($copied ? '1' : '0'));
                                    $path = 'public/questions/' . $imageFilename;
                                }
                                $uploadedFiles[] = 'public/questions/' . $imageFilename;
                                $publicPath = 'questions/' . $imageFilename;
                                /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
                                $disk = Storage::disk('public');
                                $imageUrl = $disk->url($publicPath);
                                Log::info("IMAGE_URL_GENERATED: " . $imageUrl);
                                if (!$disk->exists($publicPath)) {
                                    Log::warning('Uploaded question image not found on public disk (but URL generated)', ['path' => $publicPath]);
                                }
                                Log::info('Question image uploaded directly (legacy)', ['filename' => $imageFilename, 'path' => $path]);
                            } catch (\Exception $e) {
                                Log::error('Direct question image upload failed', ['error' => $e->getMessage(), 'filename' => $imageFilename ?? 'unknown']);
                            }
                        } elseif (is_string($qData['image_url']) && str_starts_with($qData['image_url'], 'private/temp_questions/')) {
                            // Move from temp storage to permanent
                            try {
                                $tempPath = $qData['image_url'];
                                $filename = basename($tempPath);
                                $permanentPath = 'public/questions/' . $filename;

                                if (Storage::exists($tempPath)) {
                                    // Move file from temp to permanent location
                                    Storage::move($tempPath, $permanentPath);
                                    $uploadedFiles[] = $permanentPath;
                                    $publicPath = 'questions/' . $filename;
                                    /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
                                    $disk = Storage::disk('public');
                                    if ($disk->exists($publicPath)) {
                                        $imageUrl = $disk->url($publicPath);
                                    } else {
                                        // fallback to Storage URL generation even if file not found, keeping URL generation consistent
                                        $imageUrl = $disk->url($publicPath);
                                        Log::warning('Moved file not found on public disk; generating URL anyway', ['public_path' => $publicPath]);
                                    }
                                    Log::info('Question image moved from temp to permanent', ['filename' => $filename]);
                                } else {
                                    Log::warning('Temp image file not found', ['temp_path' => $tempPath]);
                                }
                            } catch (\Exception $e) {
                                Log::error('Temp to permanent image move failed', ['error' => $e->getMessage()]);
                            }
                        } elseif (is_string($qData['image_url']) && str_starts_with($qData['image_url'], 'data:image/')) {
                            // Handle base64 image
                            try {
                                $data = explode(',', $qData['image_url']);
                                $imageData = base64_decode($data[1]);
                                $mime = explode(';', $data[0])[0];
                                $extension = explode('/', $mime)[1];
                                $imageFilename = 'quiz_' . $module->id . '_' . time() . '_' . uniqid() . '.' . $extension;
                                $path = 'questions/' . $imageFilename;
                                /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
                                $disk = Storage::disk('public');
                                $disk->put($path, $imageData);
                                $uploadedFiles[] = 'public/' . $path;
                                $imageUrl = $disk->url($path);
                                Log::info('Question image uploaded from base64', ['filename' => $imageFilename]);
                            } catch (\Exception $e) {
                                Log::error('Base64 image upload failed', ['error' => $e->getMessage()]);
                            }
                        } else {
                            Log::warning('Image data received but not in expected format', [
                                'type' => gettype($qData['image_url']),
                                'value' => is_object($qData['image_url']) ? get_class($qData['image_url']) : substr($qData['image_url'], 0, 100)
                            ]);
                        }
                    } else {
                        Log::info('No image_url field in question data', ['question_index' => $index, 'qType' => $qType]);
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

            // Cleanup uploaded files on rollback
            foreach ($uploadedFiles as $filePath) {
                if (Storage::disk('public')->exists($filePath)) {
                    Storage::disk('public')->delete($filePath);
                }
            }

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

            // Define allowed categories for BNI Finance
            $allowedCategories = [
                'Core Business & Product',
                'Credit & Risk Management',
                'Collection & Recovery',
                'Compliance & Regulatory',
                'Sales & Marketing',
                'Service Excellence',
                'Leadership & Soft Skills',
                'IT & Digital Security',
                'Onboarding'
            ];

            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'duration_minutes' => 'required|integer|min:1',
                'passing_grade' => 'required|integer|min:0',
                'category' => ['required', 'string', \Illuminate\Validation\Rule::in($allowedCategories)],
                'is_active' => 'boolean',
                'allow_retake' => 'boolean',
                'max_retake_attempts' => 'nullable|integer|min:1',
                'expiry_date' => 'nullable|date',
                'prerequisite_module_id' => 'nullable|exists:modules,id',
                'instructor_id' => 'nullable|exists:users,id',
                'certificate_template' => 'nullable|string',
                'xp' => 'nullable|integer|min:0',
                'cover_image' => 'sometimes|nullable|image|mimes:jpg,jpeg,png,webp|max:5120',
                'pretest_duration' => 'nullable|integer|min:1',
                'posttest_duration' => 'nullable|integer|min:1',
            ]);

            $module->update([
                ...$validated,
            ]);

            // Handle optional cover image update (replace old one)
            if ($request->hasFile('cover_image') && $request->file('cover_image')->isValid()) {
                try {
                    // Attempt to delete the old cover file if it exists on public disk
                    if (!empty($module->cover_image) && is_string($module->cover_image)) {
                        // cover_image stored as a URL like /storage/training-programs/covers/filename.jpg
                        $old = $module->cover_image;
                        $oldFilename = basename($old);
                        $oldRelative = 'training-programs/covers/' . $oldFilename;
                        if (Storage::disk('public')->exists($oldRelative)) {
                            Storage::disk('public')->delete($oldRelative);
                        }
                    }

                    $cover = $request->file('cover_image');
                    $coverFilename = time() . '_cover_' . uniqid() . '.' . $cover->getClientOriginalExtension();
                    $coverPath = $cover->storeAs('public/training-programs/covers', $coverFilename);
                    $publicPath = 'training-programs/covers/' . $coverFilename;
                    /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
                    $disk = Storage::disk('public');
                    $module->update(['cover_image' => $disk->url($publicPath)]);
                } catch (\Exception $e) {
                    Log::warning('Cover update failed: ' . $e->getMessage());
                }
            }

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

            DB::beginTransaction();
            try {
                $this->performDestroy($id);
                DB::commit();
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

            return response()->json([
                'success' => true,
                'message' => 'Program pelatihan berhasil dihapus',
            ]);
        } catch (\Exception $e) {
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
            $original = Module::with('questions', 'quizzes')->findOrFail($id);

            // Create duplicate
            $duplicate = $original->replicate();
            $duplicate->title = $original->title . ' (Copy)';
            $duplicate->is_active = false;
            $duplicate->save();

            // Copy quizzes
            foreach ($original->quizzes as $quiz) {
                $duplicateQuiz = $quiz->replicate();
                $duplicateQuiz->module_id = $duplicate->id;
                $duplicateQuiz->save();
            }

            // Copy questions
            foreach ($original->questions as $question) {
                $duplicateQuestion = $question->replicate();
                $duplicateQuestion->module_id = $duplicate->id;
                // Update quiz_id if it references original quiz
                if ($question->quiz_id) {
                    // Find corresponding duplicate quiz
                    $originalQuiz = $original->quizzes->where('id', $question->quiz_id)->first();
                    if ($originalQuiz) {
                        $duplicateQuiz = $duplicate->quizzes->where('type', $originalQuiz->type)->first();
                        if ($duplicateQuiz) {
                            $duplicateQuestion->quiz_id = $duplicateQuiz->id;
                        }
                    }
                }
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
     * Bulk delete programs (for admin efficiency)
     */
    public function bulkDelete(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'program_ids' => 'required|array',
            'program_ids.*' => 'exists:modules,id',
        ]);

        $deletedCount = 0;
        $errors = [];

        DB::beginTransaction();
        try {
            foreach ($validated['program_ids'] as $programId) {
                try {
                    // Reuse existing destroy logic
                    $this->performDestroy($programId);
                    $deletedCount++;
                } catch (\Exception $e) {
                    $errors[] = "Failed to delete program {$programId}: " . $e->getMessage();
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Successfully deleted {$deletedCount} programs",
                'errors' => $errors,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Bulk delete failed: ' . $e->getMessage(),
                'errors' => $errors,
            ], 500);
        }
    }

    /**
     * Smoke API: Check if a public disk image exists and return its public URL (admin only)
     */
    public function checkImageExists(Request $request)
    {
        $user = Auth::user();
        if ($user->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'path' => 'required|string'
        ]);

        $path = $request->input('path');
        // normalize input - accept '/storage/questions/..' or 'public/questions/..' or 'questions/..'
        $relative = preg_replace('#^/storage/#', '', $path);
        $relative = preg_replace('#^public/#', '', ltrim($relative, '/'));

        try {
            /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
            $disk = Storage::disk('public');
            $exists = $disk->exists($relative);
            $url = $exists ? $disk->url($relative) : null;

            return response()->json(['exists' => $exists, 'path' => $relative, 'url' => $url]);
        } catch (\Exception $e) {
            Log::error('checkImageExists error: ' . $e->getMessage());
            return response()->json(['error' => 'Internal error', 'message' => $e->getMessage()], 500);
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
            $extension = strtolower($file->getClientOriginalExtension());
            $filename = time() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '_', $file->getClientOriginalName());
            
            // Store original file
            $filepath = $file->storeAs('training-materials', $filename, 'public');
            
            // Convert to PDF if Excel/Office file
            $pdfPath = null;
            $excelExtensions = ['xlsx', 'xls', 'xlsm', 'csv'];
            
            if (in_array($extension, $excelExtensions)) {
                // Use new ExcelToPdfService for conversion
                $pdfFileName = time() . '_' . preg_replace('/\.[^.]+$/', '', basename($filename)) . '.pdf';
                $pdfStoragePath = 'training-materials/pdf/' . $pdfFileName;
                
                $fullExcelPath = storage_path('app/public/' . $filepath);
                $fullPdfPath = storage_path('app/public/' . $pdfStoragePath);
                
                Log::info("Converting Excel to PDF", ['input' => $fullExcelPath, 'output' => $fullPdfPath]);
                
                // Create PDF directory if not exists
                $pdfDir = dirname($fullPdfPath);
                if (!is_dir($pdfDir)) {
                    mkdir($pdfDir, 0755, true);
                }
                
                // Convert using service
                if (\App\Services\ExcelToPdfService::convert($fullExcelPath, $fullPdfPath)) {
                    $pdfPath = $pdfStoragePath;
                    Log::info("Excel to PDF conversion successful", ['pdf_path' => $pdfPath]);
                } else {
                    Log::warning("Excel to PDF conversion failed, will serve original file");
                }
            }

            // Map material_type to file_type
            $fileType = $request->material_type ?? 'document';
            
            // If PDF was created, display as pdf type
            if ($pdfPath) {
                $fileType = 'pdf';
            }
            
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
            Log::error('Material Upload Error: ' . $e->getMessage() . ' Trace: ' . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'message' => 'Error mengunggah materi: ' . $e->getMessage(),
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
                $publicPath = 'questions/' . $imageFilename;
                /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
                $disk = Storage::disk('public');
                if ($disk->exists($publicPath)) {
                    $imageUrl = $disk->url($publicPath);
                } else {
                    Log::warning('Uploaded question image not found on public disk', ['path' => $publicPath]);
                    $imageUrl = null;
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
                $publicPath = 'questions/' . $imageFilename;
                /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
                $disk = Storage::disk('public');
                if ($disk->exists($publicPath)) {
                    $imageUrl = $disk->url($publicPath);
                } else {
                    Log::warning('Uploaded question image not found on public disk', ['path' => $publicPath]);
                    $imageUrl = null;
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

            // OPTIMASI: Collect all assignments for bulk insert
            $moduleAssignments = [];
            $userTrainings = [];

            // Collect assignments from specific users
            if (!empty($validated['user_ids'])) {
                foreach ($validated['user_ids'] as $userId) {
                    if (!$this->isUserAlreadyAssigned($id, $userId)) {
                        $moduleAssignments[] = [
                            'module_id' => $id,
                            'user_id' => $userId,
                            'assigned_date' => now(),
                            'due_date' => $validated['due_date'] ?? null,
                            'status' => 'pending',
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];

                        if (!$this->hasUserTraining($id, $userId)) {
                            $userTrainings[] = [
                                'user_id' => $userId,
                                'module_id' => $id,
                                'status' => 'enrolled',
                                'final_score' => null,
                                'is_certified' => false,
                                'enrolled_at' => now(),
                                'completed_at' => null,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ];
                        }
                    }
                }
            }

            // Collect assignments from departments
            if (!empty($validated['departments'])) {
                $users = User::whereIn('department', $validated['departments'])->pluck('id');
                foreach ($users as $userId) {
                    if (!$this->isUserAlreadyAssigned($id, $userId)) {
                        $moduleAssignments[] = [
                            'module_id' => $id,
                            'user_id' => $userId,
                            'assigned_date' => now(),
                            'due_date' => $validated['due_date'] ?? null,
                            'status' => 'pending',
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];

                        if (!$this->hasUserTraining($id, $userId)) {
                            $userTrainings[] = [
                                'user_id' => $userId,
                                'module_id' => $id,
                                'status' => 'enrolled',
                                'final_score' => null,
                                'is_certified' => false,
                                'enrolled_at' => now(),
                                'completed_at' => null,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ];
                        }
                    }
                }
            }

            // BULK INSERT: Insert all assignments at once
            $assignedCount = 0;
            if (!empty($moduleAssignments)) {
                ModuleAssignment::insert($moduleAssignments);
                $assignedCount += count($moduleAssignments);
            }
            if (!empty($userTrainings)) {
                UserTraining::insert($userTrainings);
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
     * Helper: Check if user is already assigned to module
     */
    private function isUserAlreadyAssigned($moduleId, $userId)
    {
        return ModuleAssignment::where('module_id', $moduleId)
            ->where('user_id', $userId)
            ->exists();
    }

    /**
     * Helper: Check if user already has training record
     */
    private function hasUserTraining($moduleId, $userId)
    {
        return UserTraining::where('module_id', $moduleId)
            ->where('user_id', $userId)
            ->exists();
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

            // OPTIMASI: Single Query dengan Aggregates untuk Top Programs
            $topPrograms = DB::table('modules')
                ->leftJoin('user_trainings', 'modules.id', '=', 'user_trainings.module_id')
                ->leftJoin('exam_attempts', function($join) {
                    $join->on('modules.id', '=', 'exam_attempts.module_id')
                         ->where('exam_attempts.is_passed', true);
                })
                ->select(
                    'modules.title as program_name',
                    DB::raw('COUNT(DISTINCT user_trainings.id) as enrollments'),
                    DB::raw('COUNT(DISTINCT CASE WHEN user_trainings.status = "completed" THEN user_trainings.id END) as completions'),
                    DB::raw('AVG(exam_attempts.percentage) as avg_score')
                )
                ->where('modules.is_active', true)
                ->groupBy('modules.id', 'modules.title')
                ->orderByRaw('(COUNT(DISTINCT CASE WHEN user_trainings.status = "completed" THEN user_trainings.id END) / NULLIF(COUNT(DISTINCT user_trainings.id), 0)) DESC')
                ->limit(10)
                ->get()
                ->map(function($row) {
                    $row->completion_rate = $row->enrollments > 0
                        ? round(($row->completions / $row->enrollments) * 100, 1)
                        : 0;
                    $row->avg_score = round($row->avg_score ?? 0, 1);
                    return $row;
                });

            // OPTIMASI: Enrollment trends dengan single query aggregation
            $enrollmentTrends = DB::table('user_trainings')
                ->select(
                    DB::raw('DATE(enrolled_at) as date'),
                    DB::raw('COUNT(*) as enrollments')
                )
                ->where('enrolled_at', '>=', $startDate)
                ->groupBy(DB::raw('DATE(enrolled_at)'))
                ->orderBy('date')
                ->get()
                ->map(function($row) {
                    return [
                        'date' => \Carbon\Carbon::parse($row->date)->format('M d'),
                        'enrollments' => $row->enrollments,
                    ];
                })
                ->toArray();

            // Fill missing dates with 0 enrollments
            $allDates = [];
            for ($i = $range - 1; $i >= 0; $i--) {
                $date = now()->subDays($i);
                $dateKey = $date->format('M d');
                $allDates[$dateKey] = ['date' => $dateKey, 'enrollments' => 0];
            }

            // Merge with actual data
            foreach ($enrollmentTrends as $trend) {
                if (isset($allDates[$trend['date']])) {
                    $allDates[$trend['date']]['enrollments'] = $trend['enrollments'];
                }
            }

            $enrollmentTrends = array_values($allDates);

            // OPTIMASI: Completion rate by category dengan single query
            $categoryStats = DB::table('modules')
                ->leftJoin('user_trainings', 'modules.id', '=', 'user_trainings.module_id')
                ->select(
                    'modules.category',
                    DB::raw('COUNT(DISTINCT user_trainings.id) as total_enrollments'),
                    DB::raw('COUNT(DISTINCT CASE WHEN user_trainings.status = "completed" THEN user_trainings.id END) as completions')
                )
                ->where('modules.is_active', true)
                ->whereNotNull('modules.category')
                ->groupBy('modules.category')
                ->get()
                ->map(function($row) {
                    return [
                        'category' => $row->category,
                        'completion_rate' => $row->total_enrollments > 0 ? round(($row->completions / $row->total_enrollments) * 100, 1) : 0,
                        'total_enrollments' => $row->total_enrollments,
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

            // OPTIMASI: Department-wise performance dengan single query aggregation
            $departmentPerformance = DB::table('users')
                ->leftJoin('user_trainings', 'users.id', '=', 'user_trainings.user_id')
                ->select(
                    'users.department',
                    DB::raw('COUNT(DISTINCT user_trainings.id) as total_enrollments'),
                    DB::raw('COUNT(DISTINCT CASE WHEN user_trainings.status = "completed" THEN user_trainings.id END) as completions')
                )
                ->where('users.role', 'user')
                ->whereNotNull('users.department')
                ->groupBy('users.department')
                ->get()
                ->map(function($row) {
                    return [
                        'department' => $row->department,
                        'completion_rate' => $row->total_enrollments > 0 ? round(($row->completions / $row->total_enrollments) * 100, 1) : 0,
                        'total_enrollments' => $row->total_enrollments,
                        'total_completed' => $row->completions,
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
            // OPTIMASI: Mandatory training status dengan single query aggregation
            $mandatoryTrainings = DB::table('modules')
                ->leftJoin('user_trainings', 'modules.id', '=', 'user_trainings.module_id')
                ->select(
                    'modules.title as training_name',
                    DB::raw('COUNT(DISTINCT user_trainings.id) as enrollments'),
                    DB::raw('COUNT(DISTINCT CASE WHEN user_trainings.status = "completed" THEN user_trainings.id END) as completions')
                )
                ->where('modules.category', 'Compliance')
                ->where('modules.is_active', true)
                ->groupBy('modules.id', 'modules.title')
                ->get()
                ->map(function($row) {
                    $totalUsers = User::where('role', 'user')->count();
                    return [
                        'training_name' => $row->training_name,
                        'total_users' => $totalUsers,
                        'completed_users' => $row->completions,
                        'not_completed_users' => $totalUsers - $row->completions,
                        'compliance_rate' => $totalUsers > 0 ? round(($row->completions / $totalUsers) * 100, 1) : 0,
                    ];
                })
                ->sortByDesc('compliance_rate')
                ->values();

            // OPTIMASI: Non-compliant users dengan single query aggregation
            $nonCompliantUsers = DB::table('users')
                ->leftJoin('user_trainings', 'users.id', '=', 'user_trainings.user_id')
                ->leftJoin('modules', 'user_trainings.module_id', '=', 'modules.id')
                ->select(
                    'users.id as user_id',
                    'users.name as user_name',
                    'users.email',
                    'users.department',
                    DB::raw('COUNT(DISTINCT CASE WHEN modules.category = "Compliance" AND user_trainings.status != "completed" THEN modules.id END) as incomplete_mandatory')
                )
                ->where('users.role', 'user')
                ->where('modules.category', 'Compliance')
                ->where('modules.is_active', true)
                ->groupBy('users.id', 'users.name', 'users.email', 'users.department')
                ->having('incomplete_mandatory', '>', 0)
                ->orderByDesc('incomplete_mandatory')
                ->limit(20)
                ->get()
                ->map(function($row) {
                    $row->risk_score = $row->incomplete_mandatory > 0 ? round((min($row->incomplete_mandatory, 5) / 5) * 100, 1) : 0;
                    return $row;
                });

            // OPTIMASI: Compliance summary dengan efficient query
            $allUsers = User::where('role', 'user')->count();

            // Count users who have NO incomplete compliance trainings
            $fullyCompliant = DB::table('users')
                ->leftJoin('user_trainings', 'users.id', '=', 'user_trainings.user_id')
                ->leftJoin('modules', 'user_trainings.module_id', '=', 'modules.id')
                ->where('users.role', 'user')
                ->where('modules.category', 'Compliance')
                ->where('modules.is_active', true)
                ->where(function($q) {
                    $q->whereNull('user_trainings.status')
                      ->orWhere('user_trainings.status', '!=', 'completed');
                })
                ->distinct('users.id')
                ->count();

            // Actually, let's invert this - count users who DON'T have incomplete compliance trainings
            $usersWithIncomplete = DB::table('users')
                ->join('user_trainings', 'users.id', '=', 'user_trainings.user_id')
                ->join('modules', 'user_trainings.module_id', '=', 'modules.id')
                ->where('users.role', 'user')
                ->where('modules.category', 'Compliance')
                ->where('modules.is_active', true)
                ->where('user_trainings.status', '!=', 'completed')
                ->distinct('users.id')
                ->count();

            $fullyCompliant = $allUsers - $usersWithIncomplete;

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
     * Validate questions data before processing
     */
    public function validateQuestions(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'pre_test_questions' => 'nullable|array',
            'pre_test_questions.*.question_text' => 'nullable|string',
            'pre_test_questions.*.option_a' => 'nullable|string',
            'pre_test_questions.*.option_b' => 'nullable|string',
            'pre_test_questions.*.option_c' => 'nullable|string',
            'pre_test_questions.*.option_d' => 'nullable|string',
            'pre_test_questions.*.correct_answer' => 'nullable|in:a,b,c,d',
            'post_test_questions' => 'nullable|array',
            'post_test_questions.*.question_text' => 'nullable|string',
            'post_test_questions.*.option_a' => 'nullable|string',
            'post_test_questions.*.option_b' => 'nullable|string',
            'post_test_questions.*.option_c' => 'nullable|string',
            'post_test_questions.*.option_d' => 'nullable|string',
            'post_test_questions.*.correct_answer' => 'nullable|in:a,b,c,d',
        ]);

        $errors = [];
        $warnings = [];

        // Validate pre-test questions
        if ($request->has('pre_test_questions')) {
            foreach ($request->pre_test_questions as $index => $q) {
                $questionErrors = $this->validateSingleQuestion($q, 'Pre-test', $index + 1);
                $errors = array_merge($errors, $questionErrors);
            }
        }

        // Validate post-test questions
        if ($request->has('post_test_questions')) {
            foreach ($request->post_test_questions as $index => $q) {
                $questionErrors = $this->validateSingleQuestion($q, 'Post-test', $index + 1);
                $errors = array_merge($errors, $questionErrors);
            }
        }

        // Check for minimum questions
        $preTestCount = count($request->pre_test_questions ?? []);
        $postTestCount = count($request->post_test_questions ?? []);

        if ($preTestCount > 0 && $preTestCount < 3) {
            $warnings[] = 'Pre-test direkomendasikan minimal 3 soal untuk validitas yang baik';
        }

        if ($postTestCount > 0 && $postTestCount < 5) {
            $warnings[] = 'Post-test direkomendasikan minimal 5 soal untuk evaluasi yang komprehensif';
        }

        return response()->json([
            'valid' => empty($errors),
            'errors' => $errors,
            'warnings' => $warnings,
            'summary' => [
                'pre_test_count' => $preTestCount,
                'post_test_count' => $postTestCount,
                'total_questions' => $preTestCount + $postTestCount,
            ]
        ]);
    }

    /**
     * Validate single question data
     */
    private function validateSingleQuestion($question, $testType, $index)
    {
        $errors = [];

        // Check if question has content
        $hasContent = !empty(trim($question['question_text'] ?? ''));

        if (!$hasContent) {
            // Skip validation for empty questions
            return $errors;
        }

        // Validate question text
        if (empty(trim($question['question_text'] ?? ''))) {
            $errors[] = "{$testType} #{$index}: Pertanyaan tidak boleh kosong";
        }

        // Validate options
        $options = ['option_a', 'option_b', 'option_c', 'option_d'];
        $filledOptions = 0;

        foreach ($options as $option) {
            if (!empty(trim($question[$option] ?? ''))) {
                $filledOptions++;
            }
        }

        if ($filledOptions < 2) {
            $errors[] = "{$testType} #{$index}: Minimal 2 opsi jawaban yang diisi";
        }

        // Validate correct answer
        $correctAnswer = $question['correct_answer'] ?? '';
        if (empty($correctAnswer)) {
            $errors[] = "{$testType} #{$index}: Jawaban benar harus dipilih";
        } elseif (!in_array($correctAnswer, ['a', 'b', 'c', 'd'])) {
            $errors[] = "{$testType} #{$index}: Jawaban benar tidak valid";
        } elseif (!empty($question['option_' . $correctAnswer] ?? '')) {
            // Check if the correct answer option has content
            $correctOptionKey = 'option_' . $correctAnswer;
            if (empty(trim($question[$correctOptionKey] ?? ''))) {
                $errors[] = "{$testType} #{$index}: Opsi jawaban yang dipilih sebagai benar tidak boleh kosong";
            }
        }

        return $errors;
    }

    /**
     * Clean up temporary uploaded images (call after successful form submission)
     */
    public function cleanupTempImages(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'used_temp_paths' => 'nullable|array',
            'used_temp_paths.*' => 'string',
        ]);

        try {
            $tempDir = 'private/temp_questions';
            $usedPaths = $request->used_temp_paths ?? [];

            // Get all temp files
            $allTempFiles = Storage::files($tempDir);

            $cleanedCount = 0;
            foreach ($allTempFiles as $tempFile) {
                // If file is not in the used list, delete it
                if (!in_array($tempFile, $usedPaths)) {
                    Storage::delete($tempFile);
                    $cleanedCount++;
                }
            }

            return response()->json([
                'success' => true,
                'message' => "Cleaned up {$cleanedCount} temporary files"
            ]);

        } catch (\Exception $e) {
            Log::error('Temp image cleanup error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Cleanup gagal: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Extract destroy logic for reuse in bulk operations
     */
    private function performDestroy($id)
    {
        $module = Module::findOrFail($id);

        // Delete related records in correct order (child first)
        DB::table('user_exam_answers')->whereIn('exam_attempt_id',
            DB::table('exam_attempts')->where('module_id', $id)->pluck('id')
        )->delete();
        DB::table('exam_attempts')->where('module_id', $id)->delete();
        DB::table('user_trainings')->where('module_id', $id)->delete();
        DB::table('training_discussions')->where('module_id', $id)->delete();
        DB::table('program_approvals')->where('module_id', $id)->delete();
        DB::table('compliance_evidences')->where('module_id', $id)->delete();
        DB::table('program_notifications')->where('module_id', $id)->delete();
        DB::table('program_enrollment_metrics')->where('module_id', $id)->delete();
        DB::table('module_assignments')->where('module_id', $id)->delete();

        // Delete materials and their files
        $materials = DB::table('training_materials')->where('module_id', $id)->get();
        foreach ($materials as $material) {
            if ($material->file_path && Storage::disk('public')->exists($material->file_path)) {
                Storage::disk('public')->delete($material->file_path);
            }
        }
        DB::table('training_materials')->where('module_id', $id)->delete();

        // Delete questions and their images
        $questions = DB::table('questions')->where('module_id', $id)->get();
        foreach ($questions as $question) {
            if ($question->image_url && Storage::exists($question->image_url)) {
                Storage::delete($question->image_url);
            }
        }
        DB::table('questions')->where('module_id', $id)->delete();

        // Delete quizzes
        DB::table('quizzes')->where('module_id', $id)->delete();

        // Finally delete module
        $module->delete();
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
