<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\TrainingProgram;
use App\Models\TrainingEnrollment;
use App\Models\UserTrainingProgress;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TrainingController extends Controller
{
    /**
     * Get list of user's trainings
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $status = $request->get('status', 'all');
        $search = $request->get('search', '');
        
        // Get trainings the user is enrolled in
        $query = TrainingProgram::query()
            ->select([
                'training_programs.*',
                'training_enrollments.status as enrollment_status',
                'training_enrollments.enrolled_at',
                'training_enrollments.completed_at',
                'training_enrollments.progress'
            ])
            ->join('training_enrollments', 'training_programs.id', '=', 'training_enrollments.training_program_id')
            ->where('training_enrollments.user_id', $user->id);
        
        // Filter by status
        if ($status !== 'all') {
            $query->where('training_enrollments.status', $status);
        }
        
        // Search by title or description
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('training_programs.title', 'like', "%{$search}%")
                  ->orWhere('training_programs.description', 'like', "%{$search}%");
            });
        }
        
        $trainings = $query->orderBy('training_enrollments.enrolled_at', 'desc')
            ->paginate(12);
        
        // Get stats
        $stats = [
            'total' => TrainingEnrollment::where('user_id', $user->id)->count(),
            'in_progress' => TrainingEnrollment::where('user_id', $user->id)->where('status', 'in_progress')->count(),
            'completed' => TrainingEnrollment::where('user_id', $user->id)->where('status', 'completed')->count(),
            'not_started' => TrainingEnrollment::where('user_id', $user->id)->where('status', 'not_started')->count(),
        ];
        
        return response()->json([
            'trainings' => $trainings,
            'stats' => $stats
        ]);
    }
    
    /**
     * Get training detail
     */
    public function show($id)
    {
        $user = Auth::user();
        
        $training = TrainingProgram::with([
            'modules',
            'modules.materials',
            'instructor'
        ])->findOrFail($id);
        
        // Get user's enrollment for this training
        $enrollment = TrainingEnrollment::where('user_id', $user->id)
            ->where('training_program_id', $id)
            ->first();
        
        // Get user's progress on materials
        $completedMaterials = [];
        if ($enrollment) {
            $completedMaterials = UserTrainingProgress::where('user_id', $user->id)
                ->where('training_program_id', $id)
                ->where('material_completed', true)
                ->pluck('material_id')
                ->toArray();
        }
        
        return response()->json([
            'training' => $training,
            'enrollment' => $enrollment,
            'completedMaterials' => $completedMaterials
        ]);
    }
    
    /**
     * Start a training (enroll or resume)
     */
    public function start($id)
    {
        $user = Auth::user();
        
        $training = TrainingProgram::findOrFail($id);
        
        // Check if already enrolled
        $enrollment = TrainingEnrollment::where('user_id', $user->id)
            ->where('training_program_id', $id)
            ->first();
        
        if (!$enrollment) {
            // Create new enrollment
            $enrollment = TrainingEnrollment::create([
                'user_id' => $user->id,
                'training_program_id' => $id,
                'status' => 'in_progress',
                'enrolled_at' => now(),
                'progress' => 0
            ]);
        } else if ($enrollment->status === 'not_started') {
            // Update status to in_progress
            $enrollment->update([
                'status' => 'in_progress',
                'started_at' => now()
            ]);
        }
        
        return response()->json([
            'success' => true,
            'enrollment' => $enrollment
        ]);
    }
}
