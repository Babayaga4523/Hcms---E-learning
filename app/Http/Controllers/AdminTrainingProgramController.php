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
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
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
            $query = Module::select('id', 'title', 'description', 'duration', 'duration_minutes', 'is_active', 'passing_grade', 'category', 'cover_image', 'expiry_date', 'created_at', 'instructor_id')
                ->withCount('questions as total_questions');

            // Search
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where('title', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%")
                      ->orWhere('category', 'like', "%{$search}%");
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
                    ->where('is_completed', true)
                    ->count();
                $completionRate = $enrollmentCount > 0 ? round(($completionCount / $enrollmentCount) * 100, 2) : 0;

                return [
                    'id' => $module->id,
                    'title' => $module->title,
                    'description' => $module->description,
                    'duration' => $module->duration,
                    'duration_minutes' => $module->duration_minutes,
                    'is_active' => $module->is_active,
                    'passing_grade' => $module->passing_grade,
                    'category' => $module->category,
                    'cover_image' => $module->cover_image,
                    'total_questions' => $module->total_questions,
                    'enrollment_count' => $enrollmentCount,
                    'completion_count' => $completionCount,
                    'completion_rate' => $completionRate,
                    'expiry_date' => $module->expiry_date,
                    'created_at' => $module->created_at,
                    'status' => $module->is_active ? 'Aktif' : 'Nonaktif',
                ];
            });

            // Get statistics
            $stats = [
                'total_programs' => Module::count(),
                'active_programs' => Module::where('is_active', true)->count(),
                'inactive_programs' => Module::where('is_active', false)->count(),
                'total_questions' => Question::count(),
                'avg_completion_rate' => round(DB::table('user_trainings')
                    ->where('is_completed', true)
                    ->count() / max(1, DB::table('user_trainings')->count()) * 100, 2),
            ];

            // Get categories for filter
            $categories = Module::distinct()->pluck('category')->filter()->values();

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
            Log::error('Training Program Error: ' . $e->getMessage());
            abort(500, 'Error loading training programs');
        }
    }

    /**
     * Create program with questions (Multi-step form)
     */
    public function storeWithQuestions(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'duration_minutes' => 'required|integer|min:1',
                'passing_grade' => 'required|integer|min:0|max:100',
                'category' => 'required|string|max:255',
                'is_active' => 'boolean',
                'cover_image' => 'sometimes|image|mimes:jpeg,png,jpg|max:10240', // 10MB
                'xp' => 'sometimes|integer|min:0',
                'materials' => 'sometimes|array',
                'materials.*.type' => 'string|in:document,video,presentation,spreadsheet,pdf,ppt',
                'materials.*.title' => 'nullable|string',
                'materials.*.description' => 'nullable|string',
                'materials.*.file' => 'sometimes|file|max:102400', // 100MB
                'materials.*.url' => 'nullable|string',
                'pre_test_questions' => 'sometimes|array',
                'pre_test_questions.*.question_text' => 'required|string',
                'pre_test_questions.*.image_url' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120', // 5MB max
                'pre_test_questions.*.explanation' => 'nullable|string|max:5000',
                'pre_test_questions.*.option_a' => 'required|string',
                'pre_test_questions.*.option_b' => 'required|string',
                'pre_test_questions.*.option_c' => 'required|string',
                'pre_test_questions.*.option_d' => 'required|string',
                'pre_test_questions.*.correct_answer' => 'required|in:a,b,c,d',
                'post_test_questions' => 'sometimes|array',
                'post_test_questions.*.question_text' => 'required|string',
                'post_test_questions.*.image_url' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120', // 5MB max
                'post_test_questions.*.explanation' => 'nullable|string|max:5000',
                'post_test_questions.*.option_a' => 'required|string',
                'post_test_questions.*.option_b' => 'required|string',
                'post_test_questions.*.option_c' => 'required|string',
                'post_test_questions.*.option_d' => 'required|string',
                'post_test_questions.*.correct_answer' => 'required|in:a,b,c,d',
            ]);

            DB::beginTransaction();

            // Handle cover image upload
            $coverImagePath = null;
            if ($request->hasFile('cover_image')) {
                $coverImagePath = $request->file('cover_image')->store('training-programs/covers', 'public');
            }

            // Create module
            $module = Module::create([
                'title' => $validated['title'],
                'description' => $validated['description'],
                'duration_minutes' => $validated['duration_minutes'],
                'passing_grade' => $validated['passing_grade'],
                'category' => $validated['category'],
                'cover_image' => $coverImagePath,
                'is_active' => $validated['is_active'] ?? true,
                'xp' => $validated['xp'] ?? 0,
                'has_pretest' => true,
                'has_posttest' => true,
            ]);

            // Create pre-test questions
            if (!empty($validated['pre_test_questions'])) {
                foreach ($validated['pre_test_questions'] as $index => $questionData) {
                    $imageUrl = null;
                    
                    // Handle image upload for pretest question
                    if ($request->hasFile("pre_test_questions.$index.image_url")) {
                        $file = $request->file("pre_test_questions.$index.image_url");
                        $imageUrl = $file->store('questions', 'public');
                        Log::info("Pretest question $index image uploaded", ['path' => $imageUrl]);
                    }
                    
                    Question::create([
                        'module_id' => $module->id,
                        'question_text' => $questionData['question_text'],
                        'question_type' => 'pretest',
                        'image_url' => $imageUrl,
                        'explanation' => $questionData['explanation'] ?? null,
                        'option_a' => $questionData['option_a'],
                        'option_b' => $questionData['option_b'],
                        'option_c' => $questionData['option_c'],
                        'option_d' => $questionData['option_d'],
                        'correct_answer' => $questionData['correct_answer'],
                    ]);
                }
            }

            // Create post-test questions
            if (!empty($validated['post_test_questions'])) {
                foreach ($validated['post_test_questions'] as $index => $questionData) {
                    $imageUrl = null;
                    
                    // Handle image upload for posttest question
                    if ($request->hasFile("post_test_questions.$index.image_url")) {
                        $file = $request->file("post_test_questions.$index.image_url");
                        $imageUrl = $file->store('questions', 'public');
                        Log::info("Posttest question $index image uploaded", ['path' => $imageUrl]);
                    }
                    
                    Question::create([
                        'module_id' => $module->id,
                        'question_text' => $questionData['question_text'],
                        'question_type' => 'posttest',
                        'image_url' => $imageUrl,
                        'explanation' => $questionData['explanation'] ?? null,
                        'option_a' => $questionData['option_a'],
                        'option_b' => $questionData['option_b'],
                        'option_c' => $questionData['option_c'],
                        'option_d' => $questionData['option_d'],
                        'correct_answer' => $questionData['correct_answer'],
                    ]);
                }
            }

            // Create materials if provided with file uploads
            if ($request->has('materials')) {
                Log::info('Processing materials', ['count' => count($request->input('materials', []))]);
                
                foreach ($request->input('materials') as $index => $materialData) {
                    Log::info("Material $index", [
                        'title' => $materialData['title'] ?? 'no title',
                        'type' => $materialData['type'] ?? 'no type',
                        'has_file' => $request->hasFile("materials.$index.file"),
                        'url' => $materialData['url'] ?? 'no url'
                    ]);
                    
                    // Skip if no title
                    if (empty($materialData['title'])) {
                        Log::warning("Skipping material $index - no title");
                        continue;
                    }

                    $fileName = null;
                    $filePath = null;
                    $fileSize = 0;
                    $pdfPath = null;
                    
                    // Handle file upload
                    if ($request->hasFile("materials.$index.file")) {
                        $file = $request->file("materials.$index.file");
                        $filePath = $file->store('training-materials', 'public');
                        $fileName = $file->getClientOriginalName();
                        $fileSize = $file->getSize();
                        Log::info("File uploaded for material $index", ['path' => $filePath]);
                        
                        // Convert to PDF if Office file
                        $extension = $file->getClientOriginalExtension();
                        $converter = new PdfConverterService();
                        
                        if ($converter->needsConversion($extension)) {
                            $fullInputPath = storage_path('app/public/' . $filePath);
                            $outputDir = storage_path('app/public/training-materials/pdf');
                            
                            Log::info("Converting file to PDF", ['input' => $fullInputPath]);
                            $pdfFullPath = $converter->convertToPdf($fullInputPath, $outputDir);
                            
                            if ($pdfFullPath) {
                                // Store relative path
                                $pdfPath = 'training-materials/pdf/' . basename($pdfFullPath);
                                Log::info("PDF conversion successful", ['pdf_path' => $pdfPath]);
                            } else {
                                Log::warning("PDF conversion failed for material $index");
                            }
                        }
                    }

                    // Map type from frontend to backend
                    $fileType = $materialData['type'] ?? 'document';
                    if ($fileType === 'pdf') $fileType = 'document';
                    if ($fileType === 'ppt') $fileType = 'presentation';

                    // Create material if has file or URL
                    if ($filePath || !empty($materialData['url'])) {
                        $created = TrainingMaterial::create([
                            'module_id' => $module->id,
                            'title' => $materialData['title'],
                            'description' => $materialData['description'] ?? '',
                            'file_type' => $fileType,
                            'file_path' => $filePath ?? $materialData['url'] ?? '',
                            'pdf_path' => $pdfPath,
                            'file_name' => $fileName ?? basename($materialData['url'] ?? ''),
                            'file_size' => $fileSize,
                            'order' => $index,
                            'uploaded_by' => $user->id,
                        ]);
                        Log::info("Material created", ['id' => $created->id, 'title' => $created->title, 'has_pdf' => $pdfPath ? 'yes' : 'no']);
                    } else {
                        Log::warning("Material $index skipped - no file or URL", [
                            'title' => $materialData['title'],
                            'has_file' => $filePath ? 'yes' : 'no',
                            'has_url' => !empty($materialData['url']) ? 'yes' : 'no'
                        ]);
                    }
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Program pembelajaran berhasil dibuat dengan Pre-Test dan Post-Test',
                'program' => [
                    'id' => $module->id,
                    'title' => $module->title,
                ],
                'data' => [
                    'module_id' => $module->id,
                    'title' => $module->title,
                    'pretest_questions' => count($validated['pre_test_questions'] ?? []),
                    'posttest_questions' => count($validated['post_test_questions'] ?? []),
                    'materials' => count($request->input('materials', []))
                ]
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json(['error' => $e->errors()], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Create Program Error: ' . $e->getMessage());
            return response()->json(['error' => 'Error membuat program: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Create new training program
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        try {
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
            ]);

            $module = Module::create([
                ...$validated,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Program pelatihan berhasil dibuat',
                'data' => $module,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Create Training Program Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error membuat program pelatihan',
            ], 500);
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
            $completionCount = DB::table('user_trainings')
                ->where('module_id', $id)
                ->where('is_completed', true)
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
                'questions' => $program->questions->map(fn($q) => [
                    'id' => $q->id,
                    'text' => $q->question_text,
                    'type' => $q->question_type,
                    'difficulty' => $q->difficulty,
                    'explanation' => $q->explanation,
                    'option_a' => $q->option_a,
                    'option_b' => $q->option_b,
                    'option_c' => $q->option_c,
                    'option_d' => $q->option_d,
                ]),
                'stats' => [
                    'enrollment_count' => $enrollmentCount,
                    'completion_count' => $completionCount,
                    'completion_rate' => $completionRate,
                ],
                'learnerProgress' => $learnerProgress,
                'discussions' => $discussions,
                'auth' => ['user' => (array) $user],
            ]);
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
            ]);

            $module->update([
                ...$validated,
            ]);

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
            $module = Module::findOrFail($id);
            
            // Disable foreign key constraints for SQLite
            DB::statement('PRAGMA foreign_keys = OFF');
            
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
                
                // Delete training discussions
                DB::table('training_discussions')->where('module_id', $id)->delete();
                
                // Delete module directly using query builder to bypass Eloquent constraints
                DB::table('modules')->where('id', $id)->delete();
                
                DB::commit();
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

            // Re-enable foreign key constraints
            DB::statement('PRAGMA foreign_keys = ON');

            return response()->json([
                'success' => true,
                'message' => 'Program pelatihan berhasil dihapus',
            ]);
        } catch (\Exception $e) {
            DB::statement('PRAGMA foreign_keys = ON');
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
                'question_type' => 'required|in:multiple_choice,true_false,short_answer',
                'explanation' => 'nullable|string',
            ]);

            $question = Question::create([
                'module_id' => $id,
                ...$validated,
            ]);

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
                'question_type' => 'required|in:multiple_choice,true_false,short_answer',
                'explanation' => 'nullable|string',
            ]);

            $question->update($validated);

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
                'user_ids.*' => 'integer|exists:users,id'
            ]);

            // Remove from ModuleAssignment
            ModuleAssignment::where('module_id', $id)
                ->whereIn('user_id', $validated['user_ids'])
                ->delete();

            // Also remove from UserTraining (only if not started/in_progress/completed)
            UserTraining::where('module_id', $id)
                ->whereIn('user_id', $validated['user_ids'])
                ->where('status', 'enrolled')
                ->delete();

            return response()->json([
                'success' => true,
                'message' => 'User berhasil dihapus dari program',
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
                        ->where('user_trainings.is_completed', true)
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
                ->where('is_completed', true)
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
                        ->where('is_completed', false)
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
                        ->where('is_completed', true)
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
                        ->where('user_trainings.is_completed', false)
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

            // Remove specific user assignments
            ModuleAssignment::where('module_id', $id)
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
