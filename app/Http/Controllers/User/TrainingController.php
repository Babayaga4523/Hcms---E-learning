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
            
            // Transform to add materials_count
            $trainings->getCollection()->transform(function($training) {
                // Count virtual materials from module fields
                $count = 0;
                if ($training->video_url) $count++;
                if ($training->document_url) $count++;
                if ($training->presentation_url) $count++;
                if ($count === 0) $count = 1; // At least one content material
                
                $training->materials_count = $count;
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
            Log::error('Failed to load trainings: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal memuat data training',
                'trainings' => ['data' => []],
                'stats' => [
                    'total' => 0,
                    'in_progress' => 0,
                    'completed' => 0,
                    'not_started' => 0
                ]
            ], 200); // Return 200 to prevent frontend errors
        }
    }
    
    /**
     * Get training detail (Inertia render)
     */
    public function show($id)
    {
        try {
            $user = Auth::user();

            $training = Module::with(['questions'])->findOrFail($id);

            // Check if user is assigned to this training
            $enrollment = UserTraining::where('user_id', $user->id)
                ->where('module_id', $id)
                ->first();

            if (!$enrollment) {
                return Inertia::render('User/Training/Detail', [
                    'training' => null,
                    'enrollment' => null,
                    'progress' => null,
                    'quizzes' => [],
                    'error' => 'You are not assigned to this training'
                ]);
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
            
            return Inertia::render('User/Training/TrainingDetail', [
                'training' => $training,
                'enrollment' => $enrollment,
                'progress' => $progress,
                'quizAttempts' => $quizAttempts,
                'completedMaterials' => $progress ? [$progress->module_id] : []
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to load training detail: ' . $e->getMessage());
            
            return Inertia::render('User/Training/TrainingDetail', [
                'training' => null,
                'enrollment' => null,
                'progress' => null,
                'quizAttempts' => [],
                'completedMaterials' => [],
                'error' => 'Training tidak ditemukan'
            ]);
        }
    }
    
    /**
     * Get training detail (API response for AJAX calls)
     */
    public function showApi($id)
    {
        try {
            $user = Auth::user();

            $training = Module::with(['questions'])->findOrFail($id);

            // Check if user is assigned to this training
            $enrollment = UserTraining::where('user_id', $user->id)
                ->where('module_id', $id)
                ->first();

            if (!$enrollment) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are not assigned to this training',
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
            
            return response()->json([
                'success' => true,
                'training' => $training,
                'enrollment' => $enrollment,
                'progress' => $progress,
                'completedMaterials' => $progress ? [$progress->module_id] : []
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to load training detail: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Training tidak ditemukan',
                'training' => null,
                'enrollment' => null,
                'completedMaterials' => []
            ], 404);
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
}
