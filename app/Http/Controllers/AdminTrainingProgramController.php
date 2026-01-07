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

        try {
            // Support nested payloads such as { program: { title, ... }, questions: [...], materials: [...] }
            if ($request->has('program') && is_array($request->program)) {
                // Merge main program fields to top-level so existing validation and saving logic work
                $request->merge($request->program);

                // Also merge nested arrays if not provided at top-level
                if (isset($request->program['questions']) && ! $request->has('questions')) {
                    $request->merge(['questions' => $request->program['questions']]);
                }
                if (isset($request->program['materials']) && ! $request->has('materials')) {
                    $request->merge(['materials' => $request->program['materials']]);
                }
            }

            // Support questions/materials passed as JSON string in multipart/form-data
            if ($request->has('questions') && is_string($request->questions)) {
                $decoded = json_decode($request->questions, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $request->merge(['questions' => $decoded]);
                }
            }
            if ($request->has('materials') && is_string($request->materials)) {
                $decoded = json_decode($request->materials, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $request->merge(['materials' => $decoded]);
                }
            }

            // 1. Validasi Input
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

                // Validasi Materials
                'materials' => 'sometimes|array',
                'materials.*.title' => 'required|string', // Title wajib agar terdeteksi di input
                'materials.*.type' => 'string',
                'materials.*.description' => 'nullable|string',
                'materials.*.url' => 'nullable|string',
                'materials.*.file' => 'sometimes|file|max:102400', // 100MB

                // Validasi Questions (Support format gabungan)
                'questions' => 'sometimes|array',
                'questions.*.question_text' => 'required|string',
                'questions.*.question_type' => 'required|in:pretest,posttest',
                'questions.*.option_a' => 'required|string',
                'questions.*.option_b' => 'required|string',
                'questions.*.option_c' => 'required|string',
                'questions.*.option_d' => 'required|string',
                'questions.*.correct_answer' => 'required|in:a,b,c,d',
                'questions.*.explanation' => 'nullable|string',
                'questions.*.image_url' => 'nullable|image|max:5120',
            ]);
            DB::beginTransaction();

            // 2. Handle Cover Image
            $coverImagePath = null;
            if ($request->hasFile('cover_image')) {
                $coverImagePath = $request->file('cover_image')->store('training-programs/covers', 'public');
            }

            // 3. Simpan Module (Program Utama)
            $module = Module::create([
                'title' => $validated['title'],
                'description' => $validated['description'],
                'duration_minutes' => $validated['duration_minutes'],
                'passing_grade' => $validated['passing_grade'],
                'category' => $validated['category'] ?? null,
                'cover_image' => $coverImagePath,
                'is_active' => filter_var($request->is_active ?? false, FILTER_VALIDATE_BOOLEAN), // Pastikan boolean benar
                'allow_retake' => ($allowRetake = filter_var($request->allow_retake ?? false, FILTER_VALIDATE_BOOLEAN)),
                'max_retake_attempts' => $allowRetake ? ($validated['max_retake_attempts'] ?? 3) : 0,
                'expiry_date' => $validated['expiry_date'] ?? null,
                'prerequisite_module_id' => $validated['prerequisite_module_id'] ?? null,
                'instructor_id' => $validated['instructor_id'] ?? null,
                'certificate_template' => $validated['certificate_template'] ?? null,
                // Kita update flag ini nanti setelah menghitung soal
                'has_pretest' => false,
                'has_posttest' => false,
            ]);

            // 4. Proses Materi (Materials)
            // PENTING: Gunakan $request->materials untuk memastikan array object terbaca
            if ($request->has('materials') && is_array($request->materials)) {
                foreach ($request->materials as $index => $materialData) {

                    // Skip jika data corrupt
                    if (!isset($materialData['title'])) continue;

                    $filePath = null;
                    $pdfPath = null;
                    $fileSize = 0;
                    $fileName = null;

                    // Handle File Upload
                    // Syntax: materials[0][file]
                    if ($request->hasFile("materials.{$index}.file")) {
                        $file = $request->file("materials.{$index}.file");
                        $filePath = $file->store('training-materials', 'public');
                        $fileName = $file->getClientOriginalName();
                        $fileSize = $file->getSize();

                        // PDF Conversion Logic (Simplified)
                        $extension = $file->getClientOriginalExtension();
                        $converter = new PdfConverterService();
                        if ($converter->needsConversion($extension)) {
                            // ... logic konversi Anda tetap sama ...
                            try {
                                $fullInputPath = storage_path('app/public/' . $filePath);
                                $outputDir = storage_path('app/public/training-materials/pdf');
                                $pdfFullPath = $converter->convertToPdf($fullInputPath, $outputDir);
                                if ($pdfFullPath) {
                                    $pdfPath = 'training-materials/pdf/' . basename($pdfFullPath);
                                }
                            } catch (\Exception $e) {
                                Log::error("PDF Convert Error: " . $e->getMessage());
                            }
                        }
                    }

                    // Tentukan tipe file
                    $fileType = $materialData['type'] ?? 'document';

                    // Simpan hanya jika ada File atau URL
                    if ($filePath || !empty($materialData['url'])) {
                        TrainingMaterial::create([
                            'module_id' => $module->id,
                            'title' => $materialData['title'],
                            'description' => $materialData['description'] ?? '',
                            'file_type' => $fileType,
                            'file_path' => $filePath ?? $materialData['url'], // Simpan URL jika file kosong
                            'pdf_path' => $pdfPath,
                            'file_name' => $fileName ?? basename($materialData['url'] ?? 'link'),
                            'file_size' => $fileSize,
                            'duration_minutes' => 0, // Bisa diambil dari frontend jika ada
                            'order' => $index + 1,
                            'uploaded_by' => $user->id,
                        ]);
                    }
                }
            }

            // 5. Proses Pertanyaan (Questions)
            // Kita gabung pre_test_questions dan post_test_questions (jika frontend mengirim terpisah) ke dalam satu array logic
            $allQuestions = $request->questions ?? [];

            // Jika frontend mengirim terpisah (legacy support untuk storeWithQuestions)
            if ($request->has('pre_test_questions')) {
                foreach($request->pre_test_questions as $q) {
                    $q['question_type'] = $q['question_type'] ?? 'pretest';
                    $allQuestions[] = $q;
                }
            }
            if ($request->has('post_test_questions')) {
                foreach($request->post_test_questions as $q) {
                    $q['question_type'] = $q['question_type'] ?? 'posttest';
                    $allQuestions[] = $q;
                }
            }

            $hasPretest = false;
            $hasPosttest = false;

            if (!empty($allQuestions)) {
                foreach ($allQuestions as $index => $qData) {
                    $imageUrl = null;

                    // Default question_type jika tidak diberikan oleh frontend
                    $qType = $qData['question_type'] ?? 'pretest';

                    // Handle Image Upload untuk Question
                    // Cek key di request asli. Karena index di $allQuestions mungkin beda dengan request,
                    // kita harus hati-hati.
                    // AMANNYA: Jika format 'questions', gunakan index loop.
                    // Jika format 'pre_test', kita asumsikan logic upload file sudah ditangani di frontend mengirim 'questions' array.

                    if ($request->hasFile("questions.{$index}.image_url")) {
                        $imageUrl = $request->file("questions.{$index}.image_url")->store('questions', 'public');
                    } elseif (isset($qData['image_url']) && is_string($qData['image_url'])) {
                        // Jika frontend mengirim string path (jarang terjadi di create)
                        $imageUrl = $qData['image_url'];
                    }

                    Question::create([
                        'module_id' => $module->id,
                        'question_text' => $qData['question_text'],
                        'question_type' => $qType,
                        'image_url' => $imageUrl,
                        'explanation' => $qData['explanation'] ?? null,
                        'option_a' => $qData['option_a'],
                        'option_b' => $qData['option_b'],
                        'option_c' => $qData['option_c'],
                        'option_d' => $qData['option_d'],
                        'correct_answer' => $qData['correct_answer'],
                        'order' => $index + 1,
                        'difficulty' => 'medium', // Default
                    ]);

                    if ($qType === 'pretest') $hasPretest = true;
                    if ($qType === 'posttest') $hasPosttest = true;
                }
            }

            // Update status has_pretest/posttest di module
            $module->update([
                'has_pretest' => $hasPretest,
                'has_posttest' => $hasPosttest
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Program pelatihan berhasil dibuat lengkap dengan materi dan soal.',
                'data' => $module,
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Validasi gagal', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            // Log full trace for server logs but DO NOT return trace in API response
            Log::error('Create Training Program Error: ' . $e->getMessage());
            Log::error('Trace: ' . $e->getTraceAsString());
            return response()->json(['success' => false, 'message' => 'Server Error: ' . $e->getMessage()], 500);
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
            
            // Disable foreign key constraints (works with MySQL, PostgreSQL, SQLite)
            Schema::disableForeignKeyConstraints();
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
