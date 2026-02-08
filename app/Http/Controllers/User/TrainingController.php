<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Module;
use App\Models\UserTraining;
use App\Models\ModuleProgress;
use App\Models\Quiz;
use App\Models\ExamAttempt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class TrainingController extends Controller
{
    /**
     * Display training catalog with all available trainings
     */
    public function catalog(Request $request)
    {
        try {
            $user = Auth::user();
            
            // Get all active trainings (modules) with instructor relationship
            $query = Module::query()
                ->with('instructor')
                ->where('is_active', true)
                ->where('approval_status', 'approved');
            
            // Apply filters
            if ($request->has('category') && $request->category !== 'all') {
                $query->where('category', $request->category);
            }
            
            if ($request->has('difficulty') && $request->difficulty !== 'all') {
                $query->where('difficulty', $request->difficulty);
            }
            
            if ($request->has('search') && $request->search !== '') {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }
            
            // Apply sorting
            $sortBy = $request->get('sort', 'newest');
            switch($sortBy) {
                case 'popular':
                    $query->withCount('userTrainings')
                          ->orderBy('user_trainings_count', 'desc');
                    break;
                case 'rating':
                    $query->orderBy('rating', 'desc');
                    break;
                case 'title':
                    $query->orderBy('title', 'asc');
                    break;
                case 'newest':
                default:
                    $query->orderBy('created_at', 'desc');
                    break;
            }
            
            $trainings = $query->get();
            
            // Transform data to match frontend format
            $trainings = $trainings->map(function($module) use ($user) {
                // Check if user is enrolled
                $enrollment = UserTraining::where('user_id', $user->id)
                    ->where('module_id', $module->id)
                    ->first();
                
                // Get enrollment count
                $enrolledCount = UserTraining::where('module_id', $module->id)->count();
                
                // Calculate duration in hours
                $durationHours = $module->duration_minutes 
                    ? round($module->duration_minutes / 60, 1) . ' jam'
                    : ($module->duration ?? '2 jam');
                
                // Get instructor name
                $instructorName = $module->instructor 
                    ? $module->instructor->name 
                    : 'BNI Learning Team';
                
                // Prefer module progress if available (keeps progress consistent across user pages)
                $moduleProgress = \App\Models\ModuleProgress::where('user_id', $user->id)->where('module_id', $module->id)->first();

                $computedProgress = $moduleProgress ? (int)$moduleProgress->progress_percentage : ($enrollment->final_score ?? 0);

                return [
                    'id' => $module->id,
                    'title' => $module->title,
                    'description' => $module->description,
                    'category' => $module->category ?? 'technical',
                    'difficulty' => $module->difficulty ?? 'intermediate',
                    'duration' => $durationHours,
                    'enrolled_count' => $enrolledCount,
                    'rating' => $module->rating ?? 4.5,
                    'instructor' => $instructorName,
                    'thumbnail' => $module->cover_image,
                    'enrolled' => $enrollment ? true : false,
                    'is_new' => $module->created_at->isAfter(now()->subDays(30)),
                    'progress' => $computedProgress,
                ];
            });
            
            return Inertia::render('User/Training/Catalog', [
                'trainings' => $trainings,
                'filters' => [
                    'category' => $request->get('category', 'all'),
                    'difficulty' => $request->get('difficulty', 'all'),
                    'search' => $request->get('search', ''),
                ],
                'sortBy' => $sortBy
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to load catalog: ' . $e->getMessage());
            
            return Inertia::render('User/Training/Catalog', [
                'trainings' => [],
                'filters' => [
                    'category' => 'all',
                    'difficulty' => 'all',
                    'search' => '',
                ],
                'sortBy' => 'newest'
            ]);
        }
    }
    
    /**
     * Get list of user's trainings
     */
    public function index(Request $request)
    {
        try {
            // Debug log: record that index was hit and whether user is authenticated
            
            Log::info('TrainingController@index called', ['status' => $request->get('status', 'all'), 'search' => $request->get('search', ''), 'hasAuth' => Auth::check()]);

            // Ensure the user is authenticated; return a clear 401 for API callers if not
            if (!Auth::check()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated'
                ], 401);
            }

            $user = Auth::user();
            $status = $request->get('status', 'all');
            $search = $request->get('search', '');
            
            // Get trainings (modules) the user is enrolled in
            $query = Module::query()
                ->select([
                    'modules.*',
                    'user_trainings.status as enrollment_status',
                    'user_trainings.enrolled_at',
                    'user_trainings.completed_at',
                    'user_trainings.final_score as progress'
                ])
                ->join('user_trainings', 'modules.id', '=', 'user_trainings.module_id')
                ->where('user_trainings.user_id', $user->id);
            
            // Filter by status
            if ($status !== 'all') {
                $query->where('user_trainings.status', $status);
            }
            
            // Search by title or description
            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('modules.title', 'like', "%{$search}%")
                      ->orWhere('modules.description', 'like', "%{$search}%");
                });
            }
            
            $trainings = $query->orderBy('user_trainings.enrolled_at', 'desc')
                ->paginate(12);
            
// Transform to add materials_count and prefer ModuleProgress for progress
            $trainings->getCollection()->transform(function($training) use ($user) {
                // Count virtual materials from module fields
                $count = 0;
                if ($training->video_url) $count++;
                if ($training->document_url) $count++;
                if ($training->presentation_url) $count++;
                if ($count === 0) $count = 1; // At least one content material

                $training->materials_count = $count;

                // Prefer module progress percentage if available to keep frontend consistent
                $moduleProgress = \App\Models\ModuleProgress::where('user_id', $user->id)
                    ->where('module_id', $training->id)
                    ->first();

                $training->progress = $moduleProgress ? (int)$moduleProgress->progress_percentage : ($training->progress ?? 0);

                return $training;
            });
            
            // Get stats
            $stats = [
                'total' => UserTraining::where('user_id', $user->id)->count(),
                'in_progress' => UserTraining::where('user_id', $user->id)->where('status', 'in_progress')->count(),
                'completed' => UserTraining::where('user_id', $user->id)->where('status', 'completed')->count(),
                'not_started' => UserTraining::where('user_id', $user->id)->where('status', 'enrolled')->count(),
            ];
            
            return response()->json([
                'success' => true,
                'trainings' => $trainings,
                'stats' => $stats
            ]);
        } catch (\Exception $e) {
            // Log full exception with trace for debugging
            Log::error('Failed to load trainings: ' . $e->getMessage(), ['exception' => $e]);
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal memuat data training',
                'error' => $e->getMessage(),
                'trainings' => ['data' => []],
                'stats' => [
                    'total' => 0,
                    'in_progress' => 0,
                    'completed' => 0,
                    'not_started' => 0
                ]
            ], 500);
        }
    }
    
    /**
     * Get training detail (Inertia render)
     */
    public function show($id)
    {
        try {
            $user = Auth::user();

            $training = Module::with(['questions'])->find($id);

            if (!$training) {
                // Training not found - redirect to catalog with error message
                return redirect()->route('user.catalog')
                    ->with('error', 'Training yang Anda cari tidak ditemukan. ID training: ' . $id);
            }

            // Check if user is assigned to this training
            $enrollment = UserTraining::where('user_id', $user->id)
                ->where('module_id', $id)
                ->first();

            if (!$enrollment) {
                // User not enrolled - redirect to catalog with message
                return redirect()->route('user.catalog')
                    ->with('warning', 'Anda belum terdaftar untuk training ini: ' . $training->title);
            }

            // Add enrollment count
            $training->enrollments_count = UserTraining::where('module_id', $id)->count();
            
            // Count virtual materials from module fields
            $materialsCount = 0;
            if ($training->video_url) $materialsCount++;
            if ($training->document_url) $materialsCount++;
            if ($training->presentation_url) $materialsCount++;
            if ($materialsCount === 0) $materialsCount = 1; // At least one content material
            $training->materials_count = $materialsCount;
            
            // Get user's enrollment for this training
            $enrollment = UserTraining::where('user_id', $user->id)
                ->where('module_id', $id)
                ->first();
            
            // Get user's progress on materials
            $progress = ModuleProgress::where('user_id', $user->id)
                ->where('module_id', $id)
                ->first();
            
            // Get quizzes for this module
            $quizzes = Quiz::where('module_id', $id)->get();
            
            // Get quiz attempts for this user
            $quizAttempts = [];
            foreach ($quizzes as $quiz) {
                $examType = $quiz->type === 'pretest' ? 'pre_test' : 'post_test';
                $attempt = ExamAttempt::where('user_id', $user->id)
                    ->where('module_id', $id)
                    ->where('exam_type', $examType)
                    ->orderBy('created_at', 'desc')
                    ->first();
                
                if ($attempt) {
                    $quizAttempts[$quiz->type] = [
                        'completed' => true,
                        'score' => $attempt->score,
                        'percentage' => $attempt->percentage,
                        'is_passed' => $attempt->is_passed,
                        'attempt_id' => $attempt->id
                    ];
                } else {
                    $quizAttempts[$quiz->type] = [
                        'completed' => false,
                        'score' => 0,
                        'percentage' => 0,
                        'is_passed' => false,
                        'attempt_id' => null
                    ];
                }
            }
            
            // Get list of completed training_material IDs for this user/module
            // Consider legacy module-level assets and training_materials when listing materials
            $module = Module::find($id);
            $expectedIds = [];
            $nextId = 1;
            if ($module) {
                if ($module->video_url) $expectedIds[] = $nextId++;
                if ($module->document_url) $expectedIds[] = $nextId++;
                if ($module->presentation_url) $expectedIds[] = $nextId++;
            }
            $trainingMaterialIds = \App\Models\TrainingMaterial::where('module_id', $id)->pluck('id')->toArray();
            $expectedIds = array_merge($expectedIds, $trainingMaterialIds);

            $completedMaterialIds = \App\Models\UserMaterialProgress::where('user_id', $user->id)
                ->whereIn('training_material_id', $expectedIds)
                ->where('is_completed', true)
                ->pluck('training_material_id')
                ->toArray();

            Log::info('Completed materials for user', ['user_id' => $user->id, 'module_id' => $id, 'expected_ids' => $expectedIds, 'completed' => $completedMaterialIds]);

            // Certificate eligibility check (materials + pretest/posttest if present)
            $materialsTotal = count($expectedIds);
            $materialsCompleted = count($completedMaterialIds);

            $pretestCount = \App\Models\Question::where('module_id', $id)->where('question_type', 'pretest')->count();
            $posttestCount = \App\Models\Question::where('module_id', $id)->where('question_type', 'posttest')->count();

            $pretestPassed = true;
            if ($pretestCount > 0) {
                $pretestPassed = \App\Models\ExamAttempt::where('user_id', $user->id)
                    ->where('module_id', $id)
                    ->where('exam_type', 'pre_test')
                    ->where('is_passed', true)
                    ->exists();
            }

            $posttestPassed = true;
            if ($posttestCount > 0) {
                $posttestPassed = \App\Models\ExamAttempt::where('user_id', $user->id)
                    ->where('module_id', $id)
                    ->where('exam_type', 'post_test')
                    ->where('is_passed', true)
                    ->exists();
            }

            $certificateEligible = ($materialsTotal === $materialsCompleted) && $pretestPassed && $posttestPassed;

            return Inertia::render('User/Training/TrainingDetail', [
                'training' => $training,
                'enrollment' => $enrollment,
                'progress' => $progress,
                'quizAttempts' => $quizAttempts,
                'completedMaterials' => $completedMaterialIds,
                'certificateEligible' => $certificateEligible,
                'certificateRequirements' => [
                    'materials_total' => $materialsTotal,
                    'materials_completed' => $materialsCompleted,
                    'pretest_required' => $pretestCount > 0,
                    'pretest_passed' => $pretestPassed,
                    'posttest_required' => $posttestCount > 0,
                    'posttest_passed' => $posttestPassed,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to load training detail: ' . $e->getMessage());
            
            return redirect()->route('user.catalog')
                ->with('error', 'Terjadi kesalahan saat memuat detail training. Silakan coba lagi.');
        }
    }

    /**
     * Results / Review page for a training - shows pretest/posttest and materials
     */
    public function results($id)
    {
        try {
            $user = Auth::user();

            $training = Module::with(['trainingMaterials'])->find($id);

            if (!$training) {
                return redirect()->route('user.catalog')
                    ->with('error', 'Training yang Anda cari tidak ditemukan. ID training: ' . $id);
            }

            // Check enrollment
            $enrollment = UserTraining::where('user_id', $user->id)
                ->where('module_id', $id)
                ->first();

            if (!$enrollment) {
                return redirect()->route('user.catalog')
                    ->with('warning', 'Anda belum terdaftar untuk training ini: ' . $training->title);
            }

            // Progress record
            $progress = ModuleProgress::where('user_id', $user->id)
                ->where('module_id', $id)
                ->first();

            // Quizzes & attempts
            $quizzes = Quiz::where('module_id', $id)->get();
            $quizAttempts = [];
            foreach ($quizzes as $quiz) {
                $examType = $quiz->type === 'pretest' ? 'pre_test' : 'post_test';
                $attempt = ExamAttempt::where('user_id', $user->id)
                    ->where('module_id', $id)
                    ->where('exam_type', $examType)
                    ->orderBy('created_at', 'desc')
                    ->first();

                if ($attempt) {
                    $quizAttempts[$quiz->type] = [
                        'completed' => true,
                        'score' => $attempt->score,
                        'percentage' => $attempt->percentage,
                        'is_passed' => $attempt->is_passed,
                        'attempt_id' => $attempt->id,
                        'completed_at' => $attempt->created_at
                    ];
                } else {
                    $quizAttempts[$quiz->type] = [
                        'completed' => false,
                        'score' => 0,
                        'percentage' => 0,
                        'is_passed' => false,
                        'attempt_id' => null,
                        'completed_at' => null
                    ];
                }
            }

            // Materials with completion flags
            $materials = \App\Models\TrainingMaterial::where('module_id', $id)->orderBy('order')->get();
            $completedMaterialIds = \App\Models\UserMaterialProgress::where('user_id', $user->id)
                ->where('is_completed', true)
                ->whereHas('material', function($q) use ($id) {
                    $q->where('module_id', $id);
                })->pluck('training_material_id')->toArray();

            $materials = $materials->map(function($m) use ($completedMaterialIds) {
                return [
                    'id' => $m->id,
                    'title' => $m->title,
                    'type' => $m->material_type ?? $m->type ?? 'document',
                    'duration' => $m->duration ?? null,
                    'is_completed' => in_array($m->id, $completedMaterialIds),
                    'file_url' => $m->file_path ? asset('storage/' . $m->file_path) : null
                ];
            });

            return Inertia::render('User/Training/TrainingResults', [
                'training' => $training,
                'enrollment' => $enrollment,
                'progress' => $progress,
                'quizAttempts' => $quizAttempts,
                'materials' => $materials
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to load training results: ' . $e->getMessage());
            return redirect()->route('user.catalog')
                ->with('error', 'Terjadi kesalahan saat memuat halaman hasil pelatihan.');
        }
    }
    
    /**
     * Get training detail (API response for AJAX calls)
     */
    public function showApi($id)
    {
        try {
            $user = Auth::user();

            $training = Module::with(['questions'])->find($id);

            if (!$training) {
                return response()->json([
                    'success' => false,
                    'message' => 'Training tidak ditemukan. ID: ' . $id,
                    'training' => null
                ], 404);
            }

            // Check if user is assigned to this training
            $enrollment = UserTraining::where('user_id', $user->id)
                ->where('module_id', $id)
                ->first();

            if (!$enrollment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda belum terdaftar untuk training ini: ' . $training->title,
                    'training' => null
                ], 403);
            }

            // Get user's enrollment for this training
            $enrollment = UserTraining::where('user_id', $user->id)
                ->where('module_id', $id)
                ->first();
            
            // Get user's progress on materials
            $progress = ModuleProgress::where('user_id', $user->id)
                ->where('module_id', $id)
                ->first();
            
            $completedMaterialIds = \App\Models\UserMaterialProgress::where('user_id', $user->id)
                ->where('is_completed', true)
                ->whereHas('material', function($q) use ($id) {
                    $q->where('module_id', $id);
                })->pluck('training_material_id')->toArray();

            return response()->json([
                'success' => true,
                'training' => $training,
                'enrollment' => $enrollment,
                'progress' => $progress,
                'completedMaterials' => $completedMaterialIds
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to load training detail: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat memuat detail training',
                'training' => null,
                'enrollment' => null,
                'completedMaterials' => []
            ], 500);
        }
    }
    
    /**
     * Start a training (enroll or resume)
     */
    public function start($id)
    {
        try {
            $user = Auth::user();
            
            $training = Module::findOrFail($id);
            
            // Check if already enrolled
            $enrollment = UserTraining::where('user_id', $user->id)
                ->where('module_id', $id)
                ->first();
            
            if (!$enrollment) {
                // Create new enrollment
                $enrollment = UserTraining::create([
                    'user_id' => $user->id,
                    'module_id' => $id,
                    'status' => 'in_progress',
                    'enrolled_at' => now(),
                ]);
                
                // Create progress record
                ModuleProgress::create([
                    'user_id' => $user->id,
                    'module_id' => $id,
                    'status' => 'in_progress',
                    'progress_percentage' => 0,
                ]);
            } else if ($enrollment->status === 'enrolled') {
                // Update status to in_progress
                $enrollment->update([
                    'status' => 'in_progress',
                ]);
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Training berhasil dimulai',
                'enrollment' => $enrollment
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to start training: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal memulai training',
                'enrollment' => null
            ], 500);
        }
    }

    /**
     * Get training schedules for the authenticated user
     * PERFECT LOGIC: Combines Personal (enrolled) + Global (program_id=null) events
     */
    public function getSchedules(Request $request)
    {
        try {
            $user = Auth::user();

            // Admin users should see all schedules; learners see global + their program events
            if ($user && $user->role === 'admin') {
                $schedules = \App\Models\TrainingSchedule::query()
                    ->with('program:id,title,category')
                    ->where('status', '!=', 'cancelled')
                    ->when($request->input('from_date'), fn($q, $date) =>
                        $q->where('date', '>=', $date)
                    )
                    ->when($request->input('to_date'), fn($q, $date) =>
                        $q->where('date', '<=', $date)
                    )
                    ->orderBy('date', 'asc')
                    ->orderBy('start_time', 'asc')
                    ->get();
            } else {
                // Matches both Global events AND Personal events user is enrolled in
                $schedules = \App\Models\TrainingSchedule::query()
                    ->with('program:id,title,category')
                    ->where(function($query) use ($user) {
                        // Global Events (no program_id = for all users)
                        $query->whereNull('program_id');
                        
                        // OR: Personal Events (user must be actively enrolled in program)
                        if ($user) {
                            $query->orWhereHas('program.userTrainings', function($q) use ($user) {
                                $q->where('user_id', $user->id)
                                  ->whereIn('status', ['enrolled', 'in_progress', 'completed']);
                            });
                        }
                    })
                    ->where('status', '!=', 'cancelled')
                    ->when($request->input('from_date'), fn($q, $date) =>
                        $q->where('date', '>=', $date)
                    )
                    ->when($request->input('to_date'), fn($q, $date) =>
                        $q->where('date', '<=', $date)
                    )
                    ->orderBy('date', 'asc')
                    ->orderBy('start_time', 'asc')
                    ->get();
            }

            // FORMAT DATA for Frontend Calendar
            $formattedEvents = $schedules->map(function($event) {
                // Combine program title + event title if personal, else just title for global
                $title = $event->program 
                    ? "{$event->program->title} - {$event->title}"
                    : $event->title;
                
                // Build datetime strings - ensure always Carbon instance
                $startDateTime = $event->date instanceof \DateTime 
                    ? \Carbon\Carbon::instance($event->date) 
                    : \Carbon\Carbon::parse($event->date);
                
                if ($event->start_time) {
                    $startDateTime = $startDateTime->copy()->setTimeFromTimeString($event->start_time);
                }
                
                $endDateTime = $startDateTime->copy();
                if ($event->end_time) {
                    $endDateTime = $event->date instanceof \DateTime 
                        ? \Carbon\Carbon::instance($event->date) 
                        : \Carbon\Carbon::parse($event->date);
                    $endDateTime = $endDateTime->setTimeFromTimeString($event->end_time);
                }
                
                return [
                    'id' => $event->id,
                    'title' => $title,
                    'start' => $startDateTime->toIso8601String(),
                    'end' => $endDateTime->toIso8601String(),
                    'type' => $event->type, // webinar, offline, exam, holiday, training, deadline, reminder, event
                    'location' => $event->location,
                    'description' => $event->description,
                    'program' => $event->program ? [
                        'id' => $event->program->id,
                        'title' => $event->program->title,
                        'category' => $event->program->category,
                    ] : null,
                    'is_global' => is_null($event->program_id), // Flag untuk frontend (styling berbeda)
                    'capacity' => $event->capacity,
                    'enrolled_count' => $event->enrolled,
                    'status' => $event->status,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $formattedEvents,
                'total' => $formattedEvents->count(),
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to fetch user training schedules: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal memuat jadwal pelatihan',
                'data' => [],
                'total' => 0,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get training recommendations for the user
     * Returns modules with status: assigned, not_started, enrolled (trainings to do)
     */
    public function getRecommendations(Request $request)
    {
        try {
            if (!Auth::check()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated'
                ], 401);
            }

            $user = Auth::user();
            
            // Get modules where user is enrolled with assigned/not_started/enrolled status
            $recommendations = Module::query()
                ->with('instructor')
                ->join('user_trainings', 'modules.id', '=', 'user_trainings.module_id')
                ->where('user_trainings.user_id', $user->id)
                ->whereIn('user_trainings.status', ['assigned', 'not_started', 'enrolled'])
                ->select('modules.*', 'user_trainings.status as enrollment_status', 'user_trainings.enrolled_at')
                ->orderBy('user_trainings.enrolled_at', 'desc')
                ->get();
            
            // Transform data to match frontend format
            $recommendations = $recommendations->map(function($module) use ($user) {
                // Get enrollment count
                $enrolledCount = UserTraining::where('module_id', $module->id)->count();
                
                // Calculate duration in hours
                $durationHours = $module->duration_minutes 
                    ? round($module->duration_minutes / 60, 1)
                    : ($module->duration ?? 2);
                
                // Get instructor name
                $instructorName = $module->instructor 
                    ? $module->instructor->name 
                    : 'BNI Learning Team';
                
                // Get module progress
                $moduleProgress = ModuleProgress::where('user_id', $user->id)
                    ->where('module_id', $module->id)
                    ->first();
                
                $progress = $moduleProgress ? (int)$moduleProgress->progress_percentage : 0;
                
                return [
                    'id' => $module->id,
                    'title' => $module->title,
                    'description' => $module->description,
                    'category' => $module->category ?? 'technical',
                    'difficulty' => $module->difficulty ?? 'intermediate',
                    'duration' => $durationHours,
                    'duration_hours' => $durationHours,
                    'enrolled_count' => $enrolledCount,
                    'rating' => $module->rating ?? 4.5,
                    'instructor' => $instructorName,
                    'thumbnail' => $module->cover_image,
                    'status' => $module->enrollment_status,
                    'is_mandatory' => $module->is_mandatory ?? false,
                    'progress' => $progress,
                ];
            });
            
            return response()->json([
                'success' => true,
                'data' => $recommendations,
                'total' => $recommendations->count(),
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to fetch training recommendations: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal memuat rekomendasi pelatihan',
                'data' => [],
                'total' => 0,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show training calendar page
     */
    public function calendar()
    {
        try {
            return Inertia::render('User/Training/TrainingCalendar');
        } catch (\Exception $e) {
            Log::error('Failed to render calendar page: ' . $e->getMessage());
            abort(500);
        }
    }
}
