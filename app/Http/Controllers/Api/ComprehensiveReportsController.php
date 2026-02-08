<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Module;
use App\Models\UserTraining;
use App\Models\ExamAttempt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ComprehensiveReportsController extends Controller
{
    /**
     * Get comprehensive report data for admin dashboard
     */
    public function getComprehensiveData(Request $request)
    {
        try {
            $filters = [
                'search' => $request->query('search'),
                'department' => $request->query('department'),
                'status' => $request->query('status'),
            ];

            return response()->json([
                'employees' => $this->getEmployeeData($filters),
                'programStats' => $this->getProgramStats(),
                'learnerProgress' => $this->getLearnerProgress($filters),
                'employeeScores' => $this->getEmployeeScores($filters),
                'programTrends' => $this->getProgramTrends(),
                'statistics' => $this->getStatistics(),
                'departments' => $this->getDepartmentStats(),
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get all employee data
     */
    private function getEmployeeData($filters)
    {
        $query = User::query();

        if ($filters['search']) {
            $query->where('name', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('email', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('nip', 'like', '%' . $filters['search'] . '%');
        }

        if ($filters['department']) {
            $query->where('department', $filters['department']);
        }

        if ($filters['status']) {
            $query->where('status', $filters['status']);
        }

        return $query->select('id', 'name', 'nip', 'email', 'department', 'status')
            ->withCount('trainings')
            ->get()
            ->map(function ($employee) {
                return [
                    'id' => $employee->id,
                    'name' => $employee->name,
                    'nip' => $employee->nip,
                    'email' => $employee->email,
                    'department' => $employee->department,
                    'status' => $employee->status,
                    'total_trainings' => $employee->trainings_count,
                ];
            })
            ->toArray();
    }

    /**
     * Get program statistics
     */
    private function getProgramStats()
    {
        return DB::table('user_trainings as ut')
            ->join('modules as m', 'ut.module_id', '=', 'm.id')
            ->select(
                'm.id',
                'm.title',
                DB::raw('COUNT(ut.id) as total_enrolled'),
                DB::raw("SUM(CASE WHEN ut.status = 'completed' THEN 1 ELSE 0 END) as completed"),
                DB::raw("SUM(CASE WHEN ut.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress"),
                DB::raw("SUM(CASE WHEN ut.status = 'pending' THEN 1 ELSE 0 END) as pending")
            )
            ->groupBy('m.id', 'm.title')
            ->orderBy('total_enrolled', 'desc')
            ->get()
            ->map(function ($prog) {
                $completionRate = $prog->total_enrolled > 0 
                    ? round(($prog->completed / $prog->total_enrolled) * 100, 2)
                    : 0;
                
                return [
                    'id' => $prog->id,
                    'title' => $prog->title,
                    'total_enrolled' => $prog->total_enrolled,
                    'completed' => $prog->completed,
                    'in_progress' => $prog->in_progress,
                    'pending' => $prog->pending,
                    'completion_rate' => $completionRate,
                ];
            })
            ->toArray();
    }

    /**
     * Get learner progress data
     */
    private function getLearnerProgress($filters)
    {
        $query = DB::table('user_trainings as ut')
            ->join('users as u', 'ut.user_id', '=', 'u.id')
            ->join('modules as m', 'ut.module_id', '=', 'm.id')
            ->select(
                'u.id',
                'u.name as learner_name',
                'u.department',
                'm.title as module_name',
                'ut.status',
                'ut.progress_percentage as completion_percentage',
                'ut.updated_at as last_activity'
            );

        if ($filters['search']) {
            $query->where('u.name', 'like', '%' . $filters['search'] . '%');
        }

        if ($filters['department']) {
            $query->where('u.department', $filters['department']);
        }

        return $query->orderBy('ut.updated_at', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    'learner_name' => $item->learner_name,
                    'department' => $item->department,
                    'module_name' => $item->module_name,
                    'status' => $item->status,
                    'completion_percentage' => $item->completion_percentage ?? 0,
                    'last_activity' => Carbon::parse($item->last_activity)->format('d-m-Y H:i'),
                ];
            })
            ->toArray();
    }

    /**
     * Get employee scores in programs
     */
    private function getEmployeeScores($filters)
    {
        $query = DB::table('exam_attempts as ea')
            ->join('users as u', 'ea.user_id', '=', 'u.id')
            ->join('modules as m', 'ea.module_id', '=', 'm.id')
            ->select(
                'u.name as employee_name',
                'm.title as program_name',
                'ea.score',
                'ea.created_at as completed_at'
            )
            ->addSelect(DB::raw("
                CASE 
                    WHEN ea.score >= 70 THEN true
                    ELSE false
                END as is_passed
            "))
            ->addSelect(DB::raw("
                (SELECT ROUND(AVG(score), 2) 
                 FROM exam_attempts 
                 WHERE user_id = ea.user_id AND module_id = ea.module_id
                ) as average_score
            "));

        if ($filters['search']) {
            $query->where('u.name', 'like', '%' . $filters['search'] . '%');
        }

        if ($filters['department']) {
            $query->where('u.department', $filters['department']);
        }

        return $query->orderBy('ea.created_at', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    'employee_name' => $item->employee_name,
                    'program_name' => $item->program_name,
                    'score' => $item->score,
                    'average_score' => $item->average_score,
                    'is_passed' => $item->is_passed,
                    'completed_at' => Carbon::parse($item->completed_at)->format('d-m-Y'),
                ];
            })
            ->toArray();
    }

    /**
     * Get program trends (monthly)
     */
    private function getProgramTrends()
    {
        $months = 6; // Last 6 months
        $trends = [];

        for ($i = $months - 1; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $month = $date->format('M Y');

            $enrollments = UserTraining::whereMonth('created_at', $date->month)
                ->whereYear('created_at', $date->year)
                ->count();

            $completions = UserTraining::where('status', 'completed')
                ->whereMonth('updated_at', $date->month)
                ->whereYear('updated_at', $date->year)
                ->count();

            $trends[] = [
                'month' => $month,
                'enrollments' => $enrollments,
                'completions' => $completions,
            ];
        }

        return $trends;
    }

    /**
     * Get overall statistics
     */
    private function getStatistics()
    {
        $totalEmployees = User::count();
        $totalPrograms = Module::count();
        $completedTrainings = UserTraining::where('status', 'completed')->count();
        $inProgressTrainings = UserTraining::where('status', 'in_progress')->count();
        $totalTrainings = UserTraining::count();
        $completionRate = $totalTrainings > 0 
            ? round(($completedTrainings / $totalTrainings) * 100, 2)
            : 0;

        return [
            'total_employees' => $totalEmployees,
            'total_programs' => $totalPrograms,
            'completed_trainings' => $completedTrainings,
            'in_progress_trainings' => $inProgressTrainings,
            'pending_trainings' => UserTraining::where('status', 'pending')->count(),
            'total_trainings' => $totalTrainings,
            'completion_rate' => $completionRate,
            'total_exams' => ExamAttempt::count(),
            'average_score' => round(ExamAttempt::avg('score') ?? 0, 2),
        ];
    }

    /**
     * Get department statistics
     */
    private function getDepartmentStats()
    {
        return DB::table('users')
            ->select('department as name')
            ->selectRaw('COUNT(*) as total_employees')
            ->selectRaw('
                (SELECT COUNT(*) FROM user_trainings ut 
                 JOIN users u ON ut.user_id = u.id 
                 WHERE u.department = users.department AND ut.status = "completed") as completed_trainings
            ')
            ->groupBy('department')
            ->get()
            ->toArray();
    }
}
