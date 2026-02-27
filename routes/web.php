<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AdminTrainingProgramController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\AdminReportController;
use App\Http\Controllers\Admin\DashboardMetricsController;
use App\Http\Controllers\Admin\ReportingAnalyticsController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\ComplianceController;
use App\Http\Controllers\Admin\PreTestPostTestController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Quiz\QuestionController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

Route::get('/', function () {
    // Redirect ke dashboard jika sudah login
    if (Auth::check()) {
        if (Auth::user()->role === 'admin') {
            return redirect('/admin/dashboard');
        }
        return redirect('/dashboard');
    }
    
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// Public helper route: safely serve question images from storage/app/public/questions
// This is a fallback for environments where the web server symlink or permissions
// prevent direct access to /storage/questions/...
use Illuminate\Support\Facades\Storage;

Route::get('/storage/questions/{path}', function ($path) {
    $safePath = 'questions/' . ltrim($path, '/');
    $disk = Storage::disk('public');

    // Try direct storage path first
    if ($disk->exists($safePath)) {
        $full = storage_path('app/public/' . $safePath);
        return response()->file($full, [
            'Cache-Control' => 'public, max-age=86400'
        ]);
    }

    // Log missing file
    Log::warning("Missing question image requested", [
        'requested_path' => $path,
        'safe_path' => $safePath,
        'user_id' => Auth::id(),
        'referrer' => request()->referrer(),
        'timestamp' => now()
    ]);

    // Return placeholder SVG image instead of 404
    // This prevents quiz from breaking when images are missing
    $width = 400;
    $height = 300;
    $filename = basename($path);
    
    $svg = <<<SVG
    <svg xmlns="http://www.w3.org/2000/svg" width="{$width}" height="{$height}">
        <defs>
            <pattern id="pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <rect width="20" height="20" fill="#f3f4f6"/>
                <path d="M0 0l20 20M20 0l-20 20" stroke="#d1d5db" stroke-width="1"/>
            </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#pattern)"/>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.05)"/>
        <g text-anchor="middle">
            <rect x="50" y="80" width="300" height="140" rx="8" fill="white" stroke="#e5e7eb" stroke-width="2"/>
            <text x="200" y="130" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#374151">
                Gambar Soal Tidak Ditemukan
            </text>
            <text x="200" y="160" font-family="Arial, sans-serif" font-size="13" fill="#6b7280">
                {$filename}
            </text>
            <text x="200" y="185" font-family="Arial, sans-serif" font-size="11" fill="#9ca3af">
                Silakan hubungi admin untuk bantuan
            </text>
        </g>
        <text x="200" y="280" font-family="Arial, sans-serif" font-size="10" fill="#d1d5db" text-anchor="middle">
            Placeholder - File Missing
        </text>
    </svg>
    SVG;

    return response($svg)
        ->header('Content-Type', 'image/svg+xml')
        ->header('Cache-Control', 'public, max-age=3600');
})->where('path', '.*');

// Public helper route: safely serve material files from storage/app/public/materials
// For authenticated users only - provides fallback when direct symlink access fails
Route::get('/storage/materials/{path}', function ($path) {
    // Require authentication for material access
    if (!Auth::check()) {
        abort(401);
    }

    $safePath = 'materials/' . ltrim($path, '/');
    $candidates = [
        storage_path('app/public/' . $safePath),
        storage_path('app/private/public/' . $safePath),
        storage_path('app/' . $safePath),
    ];

    $fullPath = null;
    foreach ($candidates as $candidate) {
        if (file_exists($candidate)) {
            $fullPath = $candidate;
            break;
        }
    }

    if (!$fullPath || !file_exists($fullPath)) {
        Log::warning("Missing material file requested: {$safePath} by user " . Auth::id());
        abort(404);
    }

    return response()->file($fullPath, [
        'Cache-Control' => 'private, max-age=3600'
    ]);
})->where('path', '.*')->middleware('auth');

// Admin material preview route: allows admins to preview uploaded materials before publishing
Route::get('/admin/material-preview/{materialId}', function ($materialId) {
    // Only admin can preview
    if (!Auth::check() || Auth::user()->role !== 'admin') {
        abort(403);
    }

    $material = \App\Models\TrainingMaterial::findOrFail($materialId);
    $filePath = $material->file_path ?: $material->pdf_path;
    
    if (!$filePath) {
        abort(404);
    }

    // Check private disk first (NEW files)
    $privateCandidate = storage_path('app/materials/' . ltrim($filePath, 'materials/'));
    if (file_exists($privateCandidate)) {
        return response()->file($privateCandidate, [
            'Cache-Control' => 'private, max-age=3600',
            'Content-Disposition' => 'inline'
        ]);
    }

    // Fallback to public disk (OLD files)
    $publicCandidate = storage_path('app/public/' . ltrim($filePath, 'public/'));
    if (file_exists($publicCandidate)) {
        return response()->file($publicCandidate, [
            'Cache-Control' => 'private, max-age=3600',
            'Content-Disposition' => 'inline'
        ]);
    }

    abort(404);
})->name('admin.material.preview')->middleware('auth');

// PUBLIC API ROUTES (No authentication required)
Route::get('/api/categories', [\App\Http\Controllers\CategoryController::class, 'index'])->name('api.categories');

Route::middleware(['auth'])->group(function () {
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/activity', [DashboardController::class, 'activity'])->name('activity');
    Route::get('/api/dashboard/statistics', [DashboardController::class, 'getStatistics'])->name('dashboard.statistics');
    Route::get('/api/dashboard/training-cards', [DashboardController::class, 'getTrainingCards'])->name('dashboard.training-cards');
    Route::get('/api/dashboard/unified-updates', [DashboardController::class, 'getUnifiedUpdates'])->name('dashboard.unified-updates');

    // Learner Performance & Analytics Routes
    Route::get('/learner/performance', function() {
        return Inertia::render('User/Learner/LearnerPerformance');
    })->name('learner.performance');
    Route::get('/api/learner/performance', [\App\Http\Controllers\Learner\LearnerPerformanceController::class, 'getPerformance'])->name('learner.api.performance');
    Route::get('/api/learner/progress', [\App\Http\Controllers\Learner\LearnerProgressController::class, 'getProgress'])->name('learner.api.progress');
    Route::get('/api/learner/progress/{programId}', [\App\Http\Controllers\Learner\LearnerProgressController::class, 'getProgramProgress'])->name('learner.api.progress.program');
    Route::get('/api/learner/certifications', [\App\Http\Controllers\Learner\LearnerPerformanceController::class, 'getCertifications'])->name('learner.api.certifications');
    Route::get('/api/learner/time-analytics', [\App\Http\Controllers\Learner\LearnerPerformanceController::class, 'getTimeAnalytics'])->name('learner.api.time-analytics');
    Route::get('/api/learner/learning-stats', [\App\Http\Controllers\Learner\LearnerPerformanceController::class, 'getLearningStats'])->name('learner.api.learning-stats');

    // Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    
    // ========================================
    // USER TRAINING ROUTES
    // ========================================
    
    // Training Catalog - Browse all available trainings
    Route::get('/catalog', [\App\Http\Controllers\User\TrainingController::class, 'catalog'])->name('user.catalog');
    
    // My Trainings - List all user's assigned trainings
    Route::get('/my-trainings', function() {
        return Inertia::render('User/Training/MyTrainings');
    })->name('user.trainings');
    
    // Training Detail
    Route::get('/training/{id}', [\App\Http\Controllers\User\TrainingController::class, 'show'])->name('user.training.detail');
    
    // Training Certificate - uses controller to fetch real data
    Route::get('/training/{id}/certificate', [\App\Http\Controllers\User\CertificateController::class, 'showPage'])->name('user.training.certificate');

    // Training Results / Review page
    Route::get('/training/{id}/results', [\App\Http\Controllers\User\TrainingController::class, 'results'])->name('user.training.results');
    
    // Training Calendar - View user's training schedule
    Route::get('/training-calendar', [\App\Http\Controllers\User\TrainingController::class, 'calendar'])->name('user.training.calendar');
    
    // ========================================
    // USER MATERIAL ROUTES
    // ========================================
    
    // Material Viewer
    Route::get('/training/{trainingId}/material/{materialId}', function($trainingId, $materialId) {
        return Inertia::render('User/Material/MaterialViewer', [
            'trainingId' => $trainingId,
            'materialId' => $materialId
        ]);
    })->name('user.material.view');
    
    // ========================================
    // USER QUIZ ROUTES
    // ========================================
    
    // Take Quiz (Pretest/Posttest)
    Route::get('/training/{id}/quiz/{type}', [\App\Http\Controllers\User\QuizController::class, 'take'])->name('user.quiz.take')->where('type', 'pretest|posttest');
    
    // Quiz Result
    Route::get('/training/{id}/quiz/{type}/result/{attemptId?}', [\App\Http\Controllers\User\QuizController::class, 'showResult'])->name('user.quiz.result')->where('type', 'pretest|posttest');
    
    // ========================================
    // USER REPORT ROUTES
    // ========================================
    
    // My Reports - Learning reports and analytics
    Route::get('/my-reports', [\App\Http\Controllers\Learner\LearnerReportController::class, 'index'])->name('user.reports');
    Route::get('/api/learner/reports', [\App\Http\Controllers\Learner\LearnerReportController::class, 'getReportsData'])->name('api.learner.reports');
    Route::get('/api/learner/reports/export-pdf', [\App\Http\Controllers\Learner\LearnerReportController::class, 'exportPdf'])->name('api.learner.reports.export-pdf');
    
    // ========================================
    // USER NOTIFICATION ROUTES
    // ========================================
    
    // Notification Center - Full page notification management
    // User Pages
    Route::get('/notifications', function() {
        return Inertia::render('User/Notifications/NotificationCenter');
    })->name('user.notifications');
    
    // ========================================
    // USER API ROUTES
    // ========================================
    
    // Training API
    Route::get('/api/user/trainings', [\App\Http\Controllers\User\TrainingController::class, 'index'])->name('user.api.trainings');
    Route::get('/api/user/trainings/{id}', [\App\Http\Controllers\User\TrainingController::class, 'showApi'])->name('user.api.training.show');
    Route::post('/api/training/{id}/start', [\App\Http\Controllers\User\TrainingController::class, 'start'])->name('user.api.training.start');
    Route::get('/api/user/training-schedules', [\App\Http\Controllers\API\UserTrainingController::class, 'getSchedules'])->name('user.api.training.schedules');
    Route::get('/api/user/training-recommendations', [\App\Http\Controllers\User\TrainingController::class, 'getRecommendations'])->name('user.api.training.recommendations');
    
    // Material API
    Route::get('/api/training/{trainingId}/materials', [\App\Http\Controllers\User\MaterialController::class, 'index'])->name('user.api.materials');
    Route::get('/api/training/{trainingId}/material/{materialId}', [\App\Http\Controllers\User\MaterialController::class, 'show'])->name('user.api.material.show');
    Route::post('/api/training/{trainingId}/material/{materialId}/complete', [\App\Http\Controllers\User\MaterialController::class, 'complete'])->name('user.api.material.complete');
    Route::get('/training/{trainingId}/material/{materialId}/serve', [\App\Http\Controllers\User\MaterialController::class, 'serveFile'])->name('user.material.serve');
    
    // Quiz API
    Route::get('/api/training/{trainingId}/quiz/{type}', [\App\Http\Controllers\User\QuizController::class, 'show'])->name('user.api.quiz.show');
    Route::post('/api/training/{trainingId}/quiz/{type}/start', [\App\Http\Controllers\User\QuizController::class, 'start'])->name('user.api.quiz.start');
    Route::post('/api/quiz/{attemptId}/submit', [\App\Http\Controllers\User\QuizController::class, 'submit'])->name('user.api.quiz.submit');
    Route::get('/api/quiz/{attemptId}/result', [\App\Http\Controllers\User\QuizController::class, 'result'])->name('user.api.quiz.result');
    
    // Learning Session Tracking API
    Route::post('/api/learning/session/start', [\App\Http\Controllers\User\LearningSessionController::class, 'startSession'])->name('learning.session.start');
    Route::post('/api/learning/session/{sessionId}/end', [\App\Http\Controllers\User\LearningSessionController::class, 'endSession'])->name('learning.session.end');
    Route::get('/api/learning/session/active', [\App\Http\Controllers\User\LearningSessionController::class, 'getActiveSession'])->name('learning.session.active');
    Route::get('/api/learning/stats', [\App\Http\Controllers\User\LearningSessionController::class, 'getStats'])->name('learning.stats');
    Route::get('/api/learning/daily-activity', [\App\Http\Controllers\User\LearningSessionController::class, 'getDailyActivity'])->name('learning.daily-activity');
    
    // Reports API
    Route::get('/api/user/reports', [\App\Http\Controllers\User\ReportController::class, 'index'])->name('user.api.reports');
    Route::get('/api/user/reports/export', [\App\Http\Controllers\User\ReportController::class, 'export'])->name('user.api.reports.export');
    
    // Certificate API
    Route::get('/api/certificates/{id}', [\App\Http\Controllers\User\CertificateController::class, 'show'])->name('user.api.certificate.show');
    Route::get('/api/certificates/{id}/download', [\App\Http\Controllers\User\CertificateController::class, 'download'])->name('user.api.certificate.download');

    // Debug: certificate eligibility (local only)
    Route::get('/api/debug/certificate-eligibility', [\App\Http\Controllers\User\CertificateController::class, 'debugEligibility'])->name('api.debug.certificate-eligibility');
    
    // Public API Routes for User Access
    Route::get('/api/announcements/active', [\App\Http\Controllers\Admin\AnnouncementController::class, 'getActiveAnnouncements'])->name('api.announcements.active');
    // Recent activity API for dashboard (returns last activities for authenticated user)
    Route::get('/api/user/recent-activity', [\App\Http\Controllers\DashboardController::class, 'getRecentActivityApi'])->name('api.user.recent-activity');

    // Upcoming trainings for dashboard (refreshable)
    Route::get('/api/dashboard/upcoming', [\App\Http\Controllers\DashboardController::class, 'getUpcomingTrainingsApi'])->name('api.dashboard.upcoming');
    
    // User Notification Routes - NEW UNIFIED API (Protected with auth)
    Route::middleware('auth')->group(function () {
        Route::get('/api/user/notifications', [\App\Http\Controllers\NotificationController::class, 'index'])->name('api.user.notifications.index');
        Route::get('/api/user/notifications/stats', [\App\Http\Controllers\NotificationController::class, 'getStats'])->name('api.user.notifications.stats');
        Route::get('/api/user/notifications/unread-count', [\App\Http\Controllers\NotificationController::class, 'getUnreadCount'])->name('api.user.notifications.unread-count');
        Route::patch('/api/user/notifications/{id}/read', [\App\Http\Controllers\NotificationController::class, 'markAsRead'])->name('api.user.notifications.mark-as-read');
        Route::patch('/api/user/notifications/mark-all-read', [\App\Http\Controllers\NotificationController::class, 'markAllAsRead'])->name('api.user.notifications.mark-all-read');
        Route::delete('/api/user/notifications/{id}', [\App\Http\Controllers\NotificationController::class, 'delete'])->name('api.user.notifications.delete');
        Route::delete('/api/user/notifications', [\App\Http\Controllers\NotificationController::class, 'deleteAll'])->name('api.user.notifications.delete-all');
        Route::get('/api/user/notifications/{id}', [\App\Http\Controllers\NotificationController::class, 'show'])->name('api.user.notifications.show');
        
        // Announcement deletion route for users
        Route::delete('/api/user/announcements/{id}', function(\Illuminate\Http\Request $request, $id) {
            try {
                DB::table('announcements')->where('id', $id)->delete();
                return response()->json(['message' => 'Announcement deleted successfully']);
            } catch (\Exception $e) {
                return response()->json(['message' => 'Failed to delete announcement', 'error' => $e->getMessage()], 500);
            }
        })->name('api.user.announcements.delete');
    });

});

// Reports Export Routes - No web middleware to avoid Inertia
// Reports Export Routes - SOLUTION: Minimal middleware stack (No Inertia)
// Hanya load middleware yang diperlukan: Session, Auth, CSRF
// Tanpa HandleInertiaRequests untuk mencegah binary response dikonversi ke HTML
Route::get('/admin/reports/export-excel', [AdminReportController::class, 'exportUnifiedReportsExcel'])
    ->middleware([
        \Illuminate\Session\Middleware\StartSession::class,       // Start session (untuk Auth)
        'auth'                                                      // Check authentication
    ])
    ->name('admin.reports.export');

Route::get('/admin/reports/export-tab/{tab}', [AdminReportController::class, 'exportTabAsExcel'])
    ->middleware([
        \Illuminate\Session\Middleware\StartSession::class,       // Start session (untuk Auth)
        'auth'                                                      // Check authentication
    ])
    ->name('admin.reports.export-tab');

// Admin Routes
Route::middleware(['auth', 'admin'])->group(function () {
    // Dashboard
    Route::get('/admin/dashboard', [AdminDashboardController::class, 'index'])->name('admin.dashboard');
    // Recent Activity Page
    Route::get('/admin/recent-activity', [AdminDashboardController::class, 'recentActivity'])->name('admin.recent-activity');
    // Leaderboard Page
    Route::get('/admin/leaderboard', [AdminDashboardController::class, 'leaderboard'])->name('admin.leaderboard');
    Route::get('/admin/dashboard/reports/download', [AdminDashboardController::class, 'downloadReports'])->name('admin.dashboard.reports.download');
    Route::get('/admin/dashboard/reports/excel/download', [AdminDashboardController::class, 'downloadReportsExcel'])->name('admin.reports.excel.download');
    Route::get('/admin/search', [AdminDashboardController::class, 'search'])->name('admin.search');
    Route::get('/admin/debug-top-performers', [AdminDashboardController::class, 'debugTopPerformers'])->name('admin.debug.top-performers');
    
    // Dashboard Metrics API Endpoints
    Route::get('/api/admin/metrics/dashboard-stats', [\App\Http\Controllers\Api\AdminMetricsController::class, 'dashboardStats'])->name('admin.api.metrics.dashboard-stats');
    Route::get('/api/admin/metrics/compliance-trend', [\App\Http\Controllers\Api\AdminMetricsController::class, 'complianceTrend'])->name('admin.api.metrics.compliance-trend');
    Route::get('/api/admin/modules/performance', [\App\Http\Controllers\Api\AdminMetricsController::class, 'modulePerformance'])->name('admin.api.modules.performance');
    Route::get('/api/admin/learners/status-distribution', [\App\Http\Controllers\Api\AdminMetricsController::class, 'learnerStatusDistribution'])->name('admin.api.learners.status-distribution');
    Route::get('/api/admin/reports/recent', [\App\Http\Controllers\Api\AdminMetricsController::class, 'recentReports'])->name('admin.api.reports.recent');
    Route::get('/api/admin/actions/pending', [\App\Http\Controllers\Api\AdminMetricsController::class, 'pendingActions'])->name('admin.api.actions.pending');
    
    // Categories API Routes
    Route::get('/api/admin/categories', [\App\Http\Controllers\Admin\CategoriesController::class, 'index'])->name('admin.api.categories.index');
    Route::get('/api/admin/categories/with-metadata', [\App\Http\Controllers\Admin\CategoriesController::class, 'indexWithMetadata'])->name('admin.api.categories.metadata');
    Route::post('/api/admin/categories', [\App\Http\Controllers\Admin\CategoriesController::class, 'store'])->name('admin.api.categories.store');
    Route::delete('/api/admin/categories', [\App\Http\Controllers\Admin\CategoriesController::class, 'destroy'])->name('admin.api.categories.destroy');
    
    // Trend Analysis API Route
    Route::get('/api/admin/trend-analysis', [\App\Http\Controllers\Admin\DashboardMetricsController::class, 'trendAnalysis'])->name('admin.api.trend-analysis');
    
    // User Management Routes
    Route::get('/admin/users', [AdminUserController::class, 'index'])->name('admin.users.index');
    Route::get('/admin/users/{id}', [AdminUserController::class, 'detail'])->name('admin.users.detail');
    Route::post('/api/admin/users', [AdminUserController::class, 'store'])->name('admin.users.store');
    Route::get('/api/admin/users/{id}', [AdminUserController::class, 'show'])->name('admin.users.show');
    Route::put('/api/admin/users/{id}', [AdminUserController::class, 'update'])->name('admin.users.update');
    Route::put('/api/admin/users/{id}/info', [UserController::class, 'updateUserInfo'])->name('admin.users.update-info');
    Route::put('/api/admin/users/{id}/status', [AdminUserController::class, 'updateStatus'])->name('admin.users.update-status');
    Route::delete('/api/admin/users/{id}', [AdminUserController::class, 'destroy'])->name('admin.users.destroy');
    Route::post('/api/admin/users/bulk/status', [AdminUserController::class, 'bulkUpdateStatus'])->name('admin.users.bulk-status');
    Route::post('/api/admin/users/bulk/delete', [AdminUserController::class, 'bulkDelete'])->name('admin.users.bulk-delete');
    Route::post('/api/admin/users/{id}/reset-password', [AdminUserController::class, 'resetPassword'])->name('admin.users.reset-password');
    Route::post('/api/admin/users/import', [AdminUserController::class, 'import'])->name('admin.users.import');
    Route::get('/api/admin/users/export', [AdminUserController::class, 'export'])->name('admin.users.export')->withoutMiddleware('throttle');
    Route::get('/api/admin/users-stats', [AdminUserController::class, 'getStats'])->name('admin.users.stats');
    Route::get('/api/admin/users/{userId}/program-history', [AdminUserController::class, 'getProgramHistory'])->name('admin.users.program-history');
    Route::get('/api/admin/enrollment-history', [AdminUserController::class, 'getEnrollmentHistory'])->name('admin.enrollment.history');
    
    // Training Programs Routes
    Route::get('/admin/training-programs', [AdminTrainingProgramController::class, 'index'])->name('admin.training-programs.index');
    Route::get('/admin/training-programs/create-with-steps', function() {
        return Inertia::render('Admin/CreateProgramWithSteps');
    })->name('admin.training-programs.create-with-steps');
    Route::get('/admin/training-programs/{id}/edit', function($id) {
        $program = \App\Models\Module::findOrFail($id);
        return Inertia::render('Admin/TrainingProgramEdit', ['program' => $program]);
    })->name('admin.training-programs.edit');
    Route::get('/admin/training-programs/{id}/materials', function($id) {
        $program = \App\Models\Module::with([
            'trainingMaterials',
            'questions' => function($query) {
                // Select the new 'options' JSON instead of legacy option_a..option_d
                $query->select('id', 'module_id', 'question_text', 'image_url', 'question_type', 
                              'options', 'correct_answer', 'difficulty', 'explanation', 'points', 'order', 'created_at', 'updated_at');
            }
        ])->findOrFail($id);
        // Map trainingMaterials to materials for frontend compatibility
        $program->materials = $program->trainingMaterials;
        $program->pretest_questions = $program->questions->where('question_type', 'pretest')->values();
        $program->posttest_questions = $program->questions->where('question_type', 'posttest')->values();
        return Inertia::render('Admin/TrainingMaterialsManager', ['program' => $program]);
    })->name('admin.training-programs.materials');
    Route::get('/admin/training-programs/{id}/content-manager', function($id) {
        $program = \App\Models\Module::with([
            'trainingMaterials',
            'questions' => function($query) {
                $query->select('id', 'module_id', 'question_text', 'image_url', 'question_type', 
                              'options', 'correct_answer', 
                              'difficulty', 'explanation', 'points', 'order', 'created_at', 'updated_at');
            }
        ])->findOrFail($id);
        // Map trainingMaterials to materials for frontend compatibility
        $program->materials = $program->trainingMaterials;
        $program->pretest_questions = $program->questions->where('question_type', 'pretest')->values();
        $program->posttest_questions = $program->questions->where('question_type', 'posttest')->values();
        return Inertia::render('Admin/ContentManager', ['program' => $program]);
    })->name('admin.training-programs.content-manager');

    Route::get('/admin/training-materials-manager/{id}', function($id) {
        $program = \App\Models\Module::with([
            'trainingMaterials',
            'questions' => function($query) {
                $query->select('id', 'module_id', 'question_text', 'image_url', 'question_type', 
                              'options', 'correct_answer', 
                              'difficulty', 'explanation', 'points', 'order', 'created_at', 'updated_at');
            }
        ])->findOrFail($id);
        // Map trainingMaterials to materials for frontend compatibility
        $program->materials = $program->trainingMaterials;
        $program->pretest_questions = $program->questions->where('question_type', 'pretest')->values();
        $program->posttest_questions = $program->questions->where('question_type', 'posttest')->values();
        return Inertia::render('Admin/TrainingMaterialsManager', ['program' => $program]);
    })->name('admin.training-materials-manager');
    Route::get('/admin/training-programs/{id}/assign-users', function($id) {
        $program = \App\Models\Module::findOrFail($id);
        $users = \App\Models\User::where('role', 'user')->get(['id', 'name', 'email', 'nip', 'department']);
        
        // Get assigned users with proper mapping
        $assignedUsers = \App\Models\ModuleAssignment::where('module_id', $id)
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
        
        // Get unique departments from users
        $departments = \App\Models\User::where('role', 'user')
            ->whereNotNull('department')
            ->distinct()
            ->pluck('department')
            ->map(function($dept, $index) {
                return ['id' => $index + 1, 'name' => $dept];
            })
            ->values()
            ->toArray();
            
        return Inertia::render('Admin/UserAssignment', [
            'program' => [
                'id' => $program->id,
                'title' => $program->title,
                'assigned_users' => $assignedUsers
            ],
            'users' => $users,
            'departments' => $departments,
        ]);
    })->name('admin.training-programs.assign-users');

    // Pretest, Posttest, Exam Attempts, Analytics Pages
    Route::get('/admin/training-programs/{id}/pretest', function($id) {
        $program = \App\Models\Module::findOrFail($id);
        $questions = \App\Models\Question::where('module_id', $id)
            ->where('question_type', 'pretest')
            ->select('id', 'module_id', 'question_text', 'image_url', 'question_type', 
                    'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer', 
                    'difficulty', 'explanation', 'points', 'order', 'created_at', 'updated_at')
            ->get();
        return Inertia::render('Admin/TestManagement', ['program' => $program, 'questions' => $questions, 'testType' => 'pretest']);
    })->name('admin.training-programs.pretest');

    Route::get('/admin/training-programs/{id}/posttest', function($id) {
        $program = \App\Models\Module::findOrFail($id);
        $questions = \App\Models\Question::where('module_id', $id)
            ->where('question_type', 'posttest')
            ->select('id', 'module_id', 'question_text', 'image_url', 'question_type', 
                    'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer', 
                    'difficulty', 'explanation', 'points', 'order', 'created_at', 'updated_at')
            ->get();
        return Inertia::render('Admin/TestManagement', ['program' => $program, 'questions' => $questions, 'testType' => 'posttest']);
    })->name('admin.training-programs.posttest');

    Route::get('/admin/training-programs/{id}/exam-attempts', function($id) {
        $program = \App\Models\Module::findOrFail($id);
        $attempts = \App\Models\ExamAttempt::where('module_id', $id)
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->paginate(20);
        return Inertia::render('Admin/ExamAttempts', ['program' => $program, 'attempts' => $attempts]);
    })->name('admin.training-programs.exam-attempts');

    Route::get('/admin/training-programs/{id}/analytics', function($id) {
        $program = \App\Models\Module::findOrFail($id);
        $enrollmentCount = DB::table('user_trainings')->where('module_id', $id)->count();
        // Use status field (values: enrolled, in_progress, completed) instead of non-existent is_completed column
        $completionCount = DB::table('user_trainings')->where('module_id', $id)->where('status', 'completed')->count();
        $avgScore = DB::table('exam_attempts')->where('module_id', $id)->avg('score');
        $passRate = DB::table('exam_attempts')->where('module_id', $id)->where('score', '>=', $program->passing_grade)->count();
        
        // Fetch participants dengan detail
        $participants = DB::table('user_trainings')
            ->join('users', 'user_trainings.user_id', '=', 'users.id')
            ->leftJoin('exam_attempts', function($join) use ($id) {
                $join->on('exam_attempts.user_id', '=', 'user_trainings.user_id')
                     ->where('exam_attempts.module_id', '=', $id);
            })
            ->where('user_trainings.module_id', $id)
            ->select(
                'user_trainings.id',
                'users.id as user_id',
                'users.name',
                'users.email',
                'user_trainings.status',
                'user_trainings.enrolled_at',
                'user_trainings.completed_at',
                DB::raw('COALESCE(MAX(exam_attempts.score), 0) as latest_score'),
                DB::raw('COALESCE(MAX(exam_attempts.id), 0) > 0 as has_attempted')
            )
            ->groupBy('user_trainings.id', 'users.id', 'users.name', 'users.email', 'user_trainings.status', 'user_trainings.enrolled_at', 'user_trainings.completed_at')
            ->orderByDesc('user_trainings.completed_at')
            ->get()
            ->map(function($p) use ($program) {
                return [
                    'id' => $p->user_id,
                    'name' => $p->name,
                    'email' => $p->email,
                    'status' => $p->status,
                    'enrollment_date' => $p->enrolled_at,
                    'completion_date' => $p->completed_at,
                    'score' => (int)$p->latest_score,
                    'is_passed' => $p->latest_score >= $program->passing_grade,
                    'has_attempted' => (bool)$p->has_attempted,
                ];
            });
        
        return Inertia::render('Admin/TrainingAnalytics', [
            'program' => $program,
            'stats' => [
                'enrollment_count' => $enrollmentCount,
                'completion_count' => $completionCount,
                'completion_rate' => $enrollmentCount > 0 ? round(($completionCount / $enrollmentCount) * 100, 2) : 0,
                'avg_score' => round($avgScore ?? 0, 2),
                'pass_count' => $passRate,
                'pass_rate' => $enrollmentCount > 0 ? round(($passRate / $enrollmentCount) * 100, 2) : 0,
            ],
            'participants' => $participants
        ]);
    })->name('admin.training-programs.analytics');
    Route::get('/admin/training-programs/{id}', [AdminTrainingProgramController::class, 'show'])->name('admin.training-programs.show');
    Route::get('/api/admin/training-programs', [AdminTrainingProgramController::class, 'index'])->name('admin.api.training-programs.index');
    Route::post('/api/admin/training-programs', [AdminTrainingProgramController::class, 'store'])->name('admin.training-programs.store');
    // Smoke debug endpoint to check image existence
    Route::get('/api/admin/debug/image-exists', [AdminTrainingProgramController::class, 'checkImageExists'])->name('admin.debug.image-exists');
    // Backwards compatible endpoint used by some frontend components
    Route::post('/api/admin/training-programs/with-questions', [AdminTrainingProgramController::class, 'store'])->name('admin.training-programs.store-with-questions');
    Route::put('/api/admin/training-programs/{id}', [AdminTrainingProgramController::class, 'update'])->name('admin.training-programs.update');
    Route::delete('/api/admin/training-programs/{id}', [AdminTrainingProgramController::class, 'destroy'])->name('admin.training-programs.destroy');
    Route::post('/api/admin/training-programs/{id}/duplicate', [AdminTrainingProgramController::class, 'duplicate'])->name('admin.training-programs.duplicate');
    Route::post('/api/admin/training-programs/{id}/send-reminder', [AdminTrainingProgramController::class, 'sendReminder'])->name('admin.training-programs.send-reminder');
    Route::post('/api/admin/training-programs/bulk/status', [AdminTrainingProgramController::class, 'bulkUpdateStatus'])->name('admin.training-programs.bulk-status');
    Route::post('/api/admin/training-programs/bulk/delete', [AdminTrainingProgramController::class, 'bulkDelete'])->name('admin.training-programs.bulk-delete');

    // Training Schedule Pages
    Route::get('/admin/training-schedule', function() {
        return Inertia::render('Admin/TrainingCalendarLight');
    })->name('admin.training-schedule');

    Route::get('/admin/schedule-manager', function() {
        return Inertia::render('Admin/ScheduleManager');
    })->name('admin.schedule-manager');

    // Audit & Compliance Pages
    Route::get('/admin/compliance', function() {
        return Inertia::render('Admin/ComplianceTracker');
    })->name('admin.compliance.tracker');

    Route::get('/admin/audit-logs', function() {
        return Inertia::render('Admin/AuditLogViewer');
    })->name('admin.audit-logs');

    Route::get('/admin/approval-workflow', function() {
        return Inertia::render('Admin/ApprovalWorkflow');
    })->name('admin.approval-workflow');
    
    // Training Materials Routes
    Route::post('/api/admin/training-programs/{id}/upload-material', [AdminTrainingProgramController::class, 'uploadMaterial'])->name('admin.training-programs.upload-material');
    Route::delete('/api/admin/training-programs/materials/{id}', [AdminTrainingProgramController::class, 'deleteMaterial'])->name('admin.training-programs.delete-material');
    Route::delete('/api/admin/materials/{id}', [AdminTrainingProgramController::class, 'deleteMaterial'])->name('admin.materials.delete');
    
    // Training Questions Routes (Quiz Management)
    Route::get('/admin/questions', function() {
        return Inertia::render('Admin/QuestionBank');
    })->name('admin.questions.index');
    Route::get('/admin/questions/create', function() {
        return Inertia::render('Admin/QuestionManagement');
    })->name('admin.questions.create');
    Route::get('/admin/questions/{question}/edit', function(\App\Models\Question $question) {
        return Inertia::render('Admin/QuestionManagement', ['question' => $question]);
    })->name('admin.questions.edit');
    
    // Alias routes for question-management (for pretest/posttest)
    Route::get('/admin/question-management', function(\Illuminate\Http\Request $request) {
        return Inertia::render('Admin/QuestionManagement', [
            'module_id' => $request->query('module'),
            'question_type' => $request->query('type'),
            'returnUrl' => $request->query('returnUrl'),
        ]);
    })->name('admin.question-management.create');
    Route::get('/admin/question-management/{id}', function($id, \Illuminate\Http\Request $request) {
        try {
            $question = \App\Models\Question::findOrFail($id);
            $questionArray = $question->toArray();
            // Ensure image_url uses accessor
            $questionArray['image_url'] = $question->image_url;
            return Inertia::render('Admin/QuestionManagement', [
                'question' => $questionArray,
                'returnUrl' => $request->query('returnUrl'),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return Inertia::render('Admin/QuestionManagement', [
                'question' => null,
                'returnUrl' => $request->query('returnUrl'),
            ]);
        }
    })->name('admin.question-management.edit');
    
    // Question API Routes
    Route::get('/api/questions', [QuestionController::class, 'index'])->name('questions.index');
    Route::post('/api/questions', [QuestionController::class, 'store'])->name('questions.store');
    Route::get('/api/questions/statistics', [QuestionController::class, 'statistics'])->name('questions.statistics');
    Route::get('/api/questions/export', [QuestionController::class, 'export'])->name('questions.export')->withoutMiddleware('throttle');
    Route::post('/api/questions/reorder', [QuestionController::class, 'reorder'])->name('questions.reorder');
    Route::post('/api/questions/bulk-import', [QuestionController::class, 'bulkImport'])->name('questions.bulk-import');
    Route::get('/api/questions/{question}', [QuestionController::class, 'show'])->name('questions.show');
    Route::put('/api/questions/{question}', [QuestionController::class, 'update'])->name('questions.update');
    Route::delete('/api/questions/{question}', [QuestionController::class, 'destroy'])->name('questions.destroy');
    
    // Training Schedule Routes - Specific routes BEFORE parameterized routes
    Route::get('/api/admin/training-schedules', [\App\Http\Controllers\Admin\TrainingScheduleController::class, 'index'])->name('admin.training-schedules.index');
    Route::post('/api/admin/training-schedules', [\App\Http\Controllers\Admin\TrainingScheduleController::class, 'store'])->name('admin.training-schedules.store');
    Route::get('/api/admin/training-schedules/instructors', [\App\Http\Controllers\Admin\TrainingScheduleController::class, 'getInstructors'])->name('admin.training-schedules.instructors');
    Route::get('/api/admin/training-schedules/upcoming', [\App\Http\Controllers\Admin\TrainingScheduleController::class, 'upcoming'])->name('admin.training-schedules.upcoming');
    Route::get('/api/admin/training-schedules-statistics', [\App\Http\Controllers\Admin\TrainingScheduleController::class, 'statistics'])->name('admin.training-schedules.statistics');
    Route::get('/api/admin/training-schedules-diagnostic', [\App\Http\Controllers\Admin\TrainingScheduleController::class, 'diagnostic'])->name('admin.training-schedules.diagnostic');
    // Parameterized routes AFTER specific routes
    Route::get('/api/admin/training-schedules/{trainingSchedule}', [\App\Http\Controllers\Admin\TrainingScheduleController::class, 'show'])->name('admin.training-schedules.show');
    Route::put('/api/admin/training-schedules/{trainingSchedule}', [\App\Http\Controllers\Admin\TrainingScheduleController::class, 'update'])->name('admin.training-schedules.update');
    Route::delete('/api/admin/training-schedules/{trainingSchedule}', [\App\Http\Controllers\Admin\TrainingScheduleController::class, 'destroy'])->name('admin.training-schedules.destroy');
    
    // System Settings & Configuration Routes
    Route::get('/admin/system-settings', function() {
        return Inertia::render('Admin/SystemSettings');
    })->name('admin.settings.system');
    
    Route::get('/admin/email-configuration', function() {
        return Inertia::render('Admin/EmailConfiguration');
    })->name('admin.settings.email');
    
    Route::get('/admin/notification-preferences', function() {
        return Inertia::render('Admin/NotificationPreferences');
    })->name('admin.settings.notifications');
    
    // System Settings API Routes
    Route::get('/api/admin/settings', [\App\Http\Controllers\Admin\SettingsController::class, 'getSettings'])->name('admin.api.settings.get');
    Route::post('/api/admin/settings', [\App\Http\Controllers\Admin\SettingsController::class, 'saveSettings'])->name('admin.api.settings.save');
    Route::post('/api/admin/backup', [\App\Http\Controllers\Admin\SettingsController::class, 'createBackup'])->name('admin.api.backup.create');
    Route::get('/api/admin/backups', [\App\Http\Controllers\Admin\SettingsController::class, 'getBackups'])->name('admin.api.backups.list');
    Route::get('/api/admin/backup-download/{backupId}', [\App\Http\Controllers\Admin\SettingsController::class, 'downloadBackup'])->name('admin.api.backup.download');
    Route::get('/api/admin/settings/audit-logs', [\App\Http\Controllers\Admin\SettingsController::class, 'getAuditLogs'])->name('admin.api.settings.audit-logs');
    Route::get('/api/admin/settings/history/{settingName}', [\App\Http\Controllers\Admin\SettingsController::class, 'getSettingHistory'])->name('admin.api.settings.history');
    
    // Email Configuration API Routes
    Route::get('/api/admin/email-config', [\App\Http\Controllers\Admin\EmailConfigurationController::class, 'getConfiguration'])->name('admin.api.email.get');
    Route::post('/api/admin/email-config', [\App\Http\Controllers\Admin\EmailConfigurationController::class, 'saveConfiguration'])->name('admin.api.email.save');
    Route::post('/api/admin/email-test', [\App\Http\Controllers\Admin\EmailConfigurationController::class, 'testEmail'])->name('admin.api.email.test');
    
    // Notification Preferences API Routes
    Route::get('/api/admin/notification-preferences', [\App\Http\Controllers\Admin\NotificationPreferencesController::class, 'getPreferences'])->name('admin.api.notification-preferences.get');
    Route::post('/api/admin/notification-preferences', [\App\Http\Controllers\Admin\NotificationPreferencesController::class, 'savePreferences'])->name('admin.api.notification-preferences.save');
    Route::get('/api/admin/sms-config', [\App\Http\Controllers\Admin\NotificationPreferencesController::class, 'getSmsConfiguration'])->name('admin.api.sms.get');
    Route::post('/api/admin/sms-config', [\App\Http\Controllers\Admin\NotificationPreferencesController::class, 'saveSmsConfiguration'])->name('admin.api.sms.save');
    Route::post('/api/admin/sms-test', [\App\Http\Controllers\Admin\NotificationPreferencesController::class, 'testSms'])->name('admin.api.sms.test');
    
    // Legacy Training Questions Routes (keep for backward compatibility)
    Route::post('/api/admin/training-programs/{id}/questions', [AdminTrainingProgramController::class, 'addQuestion'])->name('admin.training-programs.add-question');
    Route::put('/api/admin/training-programs/questions/{id}', [AdminTrainingProgramController::class, 'updateQuestion'])->name('admin.training-programs.update-question');
    Route::delete('/api/admin/training-programs/questions/{id}', [AdminTrainingProgramController::class, 'deleteQuestion'])->name('admin.training-programs.delete-question');
    
    // Training Assignment Routes
    Route::post('/api/admin/training-programs/{id}/assign-users', [AdminTrainingProgramController::class, 'assignUsers'])->name('admin.training-programs.assign');
    Route::get('/api/admin/training-programs/{id}/assigned-users', [AdminTrainingProgramController::class, 'getAssignedUsers'])->name('admin.training-programs.get-assigned');
    Route::delete('/api/admin/training-programs/{id}/remove-users', [AdminTrainingProgramController::class, 'removeAssignedUsers'])->name('admin.training-programs.remove-assigned');
    
    // Exam Attempts Export
    Route::get('/api/admin/training-programs/{id}/exam-attempts/export', [AdminTrainingProgramController::class, 'exportExamAttempts'])->name('admin.training-programs.exam-attempts.export')->withoutMiddleware('throttle');
    Route::get('/admin/training-programs/{id}/export-analytics', [AdminTrainingProgramController::class, 'exportAnalytics'])->name('admin.training-programs.export-analytics')->withoutMiddleware('throttle');
    Route::get('/api/admin/exam-attempts/{attemptId}', [AdminTrainingProgramController::class, 'getExamAttemptDetail'])->name('admin.exam-attempts.detail');
    
    // Reporting Routes
    Route::get('/api/admin/training-programs/stats/reporting', [AdminTrainingProgramController::class, 'getReportingStats'])->name('admin.training-programs.reporting-stats');
    Route::get('/api/admin/training-programs/analytics/overview', [AdminTrainingProgramController::class, 'getAnalytics'])->name('admin.training-programs.analytics.overview');
    Route::get('/api/admin/training-programs/reports/overview', [AdminTrainingProgramController::class, 'getReports'])->name('admin.training-programs.reports');
    Route::get('/api/admin/training-programs/compliance/overview', [AdminTrainingProgramController::class, 'getCompliance'])->name('admin.training-programs.compliance');
    
// Reports Export Routes (outside admin group to avoid middleware issues)
Route::middleware('auth')->group(function () {
    
    // Reports & Compliance Routes
    // ===== UNIFIED REPORTS (Comprehensive + Unified merged) =====
    Route::get('/admin/reports', [AdminReportController::class, 'indexUnified'])->name('admin.reports.index');    // Additional report export routes inside admin group
    // 
    Route::get('/admin/reports/comprehensive', function() { return redirect('/admin/reports?tab=programs'); })->name('admin.reports.comprehensive');
    
    Route::post('/admin/reports/export', [AdminReportController::class, 'exportReport'])->name('admin.reports.export.post')->withoutMiddleware('throttle');
    Route::get('/admin/reports/{id}/download', [AdminReportController::class, 'downloadReport'])->name('admin.reports.file.download')->withoutMiddleware('throttle');
    Route::get('/api/admin/reports/export', [AdminReportController::class, 'export'])->name('admin.reports.api.export')->withoutMiddleware('throttle');
    Route::get('/api/admin/reports/user/{id}', [AdminReportController::class, 'getUserCompliance'])->name('admin.reports.user');
    
    // FEATURE 1: Learner Report Card (Rapor Karyawan)
    Route::get('/api/admin/learner-reportcard/{userId}', [AdminReportController::class, 'getLearnerReportCard'])->name('admin.learner.reportcard');
    
    // FEATURE 2: Dropout Prediction
    Route::get('/api/admin/dropout-predictions', [AdminReportController::class, 'getDropoutPredictions'])->name('admin.dropout.predictions');
    
    // FEATURE 3: Peak Performance Heatmap
    Route::get('/api/admin/peak-performance', [AdminReportController::class, 'getPeakPerformanceHeatmap'])->name('admin.peak.performance');
    Route::get('/api/admin/peak-performance/{department}', [AdminReportController::class, 'getDepartmentPeakPerformance'])->name('admin.peak.performance.department');
    
    Route::get('/api/admin/reports/comprehensive', [\App\Http\Controllers\Api\ComprehensiveReportsController::class, 'getComprehensiveData'])->name('admin.reports.comprehensive.api');

    // Lightweight API for frontend dashboard: list of recent reports + aggregates
    Route::get('/api/admin/reports', [AdminReportController::class, 'getReportsApi'])->name('admin.reports.api');

    // Analytics payload for dashboard charts (combined metrics)
    Route::get('/api/admin/analytics', [\App\Http\Controllers\Admin\AdminAnalyticsController::class, 'index'])->name('admin.analytics.api');
    
    // Dashboard Metrics Routes (HIGH PRIORITY)
    Route::get('/api/admin/metrics/dashboard-stats', [DashboardMetricsController::class, 'getDashboardStats'])->name('admin.metrics.dashboard-stats');
    Route::get('/api/admin/metrics/enrollment-trend', [DashboardMetricsController::class, 'getEnrollmentTrend'])->name('admin.metrics.enrollment-trend');
    Route::get('/api/admin/metrics/program/{id}', [DashboardMetricsController::class, 'getProgramMetrics'])->name('admin.metrics.program');
    Route::get('/api/admin/metrics/learner-performance/{id}', [DashboardMetricsController::class, 'getLearnerPerformance'])->name('admin.metrics.learner-performance');
    Route::get('/api/admin/metrics/export', [DashboardMetricsController::class, 'exportMetrics'])->name('admin.metrics.export')->withoutMiddleware('throttle');
    Route::get('/api/admin/reports/export-csv', [DashboardMetricsController::class, 'exportReportsCSV'])->name('admin.reports.export-csv')->withoutMiddleware('throttle');
    Route::get('/api/admin/reports/export-summary-csv', [DashboardMetricsController::class, 'exportReportsSummaryCSV'])->name('admin.reports.export-summary-csv')->withoutMiddleware('throttle');
    
    // Reporting & Analytics Routes (HIGH PRIORITY)
    Route::get('/api/admin/reporting/learning-effectiveness', [ReportingAnalyticsController::class, 'getLearningEffectiveness'])->name('admin.reporting.learning-effectiveness');
    Route::get('/api/admin/reporting/learning-effectiveness/{id}', [ReportingAnalyticsController::class, 'getLearningEffectiveness'])->name('admin.reporting.program-effectiveness');
    Route::get('/api/admin/reporting/question-analysis/{id}', [ReportingAnalyticsController::class, 'getQuestionAnalysis'])->name('admin.reporting.question-analysis');
    Route::get('/api/admin/reporting/time-spent/{id}', [ReportingAnalyticsController::class, 'getTimeSpentAnalysis'])->name('admin.reporting.time-spent');
    Route::get('/api/admin/reporting/program-report/{id}', [ReportingAnalyticsController::class, 'generateProgramReport'])->name('admin.reporting.program-report');
    Route::get('/api/admin/reporting/export-pdf/{id}', [ReportingAnalyticsController::class, 'exportReportPDF'])->name('admin.reporting.export-pdf')->withoutMiddleware('throttle');
    Route::get('/api/admin/reporting/export-excel/{id}', [ReportingAnalyticsController::class, 'exportReportExcel'])->name('admin.reporting.export-excel')->withoutMiddleware('throttle');
    
    // Compliance Routes (HIGH PRIORITY) - Fixed parameter names to match controller methods
    Route::post('/api/admin/compliance/programs/{moduleId}/request-approval', [ComplianceController::class, 'requestApproval'])->name('admin.compliance.request-approval');
    Route::post('/api/admin/compliance/approvals/{approvalId}/approve', [ComplianceController::class, 'approveProgram'])->name('admin.compliance.approve');
    Route::post('/api/admin/compliance/approvals/{approvalId}/reject', [ComplianceController::class, 'rejectProgram'])->name('admin.compliance.reject');
    Route::get('/api/admin/compliance/programs/{moduleId}/approval-history', [ComplianceController::class, 'getApprovalHistory'])->name('admin.compliance.approval-history');
    Route::post('/api/admin/compliance/programs/{moduleId}/upload-evidence', [ComplianceController::class, 'uploadEvidence'])->name('admin.compliance.upload-evidence');
    Route::post('/api/admin/compliance/evidences/{evidenceId}/verify', [ComplianceController::class, 'verifyEvidence'])->name('admin.compliance.verify-evidence');
    Route::get('/api/admin/compliance/programs/{moduleId}/evidences', [ComplianceController::class, 'getEvidences'])->name('admin.compliance.get-evidences');
    Route::get('/api/admin/compliance/programs/{moduleId}/audit-log', [ComplianceController::class, 'getAuditLog'])->name('admin.compliance.audit-log');
    Route::get('/api/admin/compliance/programs/{moduleId}/compliance-report', [ComplianceController::class, 'generateComplianceReport'])->name('admin.compliance.compliance-report');
    
    // Pre-Test & Post-Test Routes
    Route::get('/api/admin/pretest-posttest/questions/{moduleId}/{examType}', [PreTestPostTestController::class, 'getQuestions'])->name('admin.pretest-posttest.questions');
    Route::post('/api/admin/pretest-posttest/start/{moduleId}', [PreTestPostTestController::class, 'startExam'])->name('admin.pretest-posttest.start');
    Route::post('/api/admin/pretest-posttest/submit/{examAttemptId}', [PreTestPostTestController::class, 'submitExam'])->name('admin.pretest-posttest.submit');
    Route::get('/api/admin/pretest-posttest/result/{examAttemptId}', [PreTestPostTestController::class, 'getExamResult'])->name('admin.pretest-posttest.result');
    Route::get('/api/admin/pretest-posttest/module-progress/{moduleId}', [PreTestPostTestController::class, 'getModuleProgress'])->name('admin.pretest-posttest.module-progress');

    // Material progress endpoint for tracking user per-material progress
    Route::post('/api/materials/{materialId}/progress', [\App\Http\Controllers\Api\MaterialProgressController::class, 'store'])->name('api.materials.progress');
    Route::get('/api/admin/pretest-posttest/module-attempts/{moduleId}', [PreTestPostTestController::class, 'getModuleAttempts'])->name('admin.pretest-posttest.module-attempts');
    
    // User Management - Roles & Permissions
    Route::get('/admin/roles-permissions', [UserController::class, 'getRoles'])->name('admin.roles.index');
    Route::get('/api/admin/roles-api', [UserController::class, 'getApiRoles'])->name('admin.roles.api');
    Route::get('/api/admin/permissions-api', [UserController::class, 'getApiPermissions'])->name('admin.permissions.api');
    Route::get('/api/admin/roles-stats', [UserController::class, 'getRoleStats'])->name('admin.roles.stats');
    Route::post('/api/admin/roles', [UserController::class, 'storeRole'])->name('admin.roles.store');
    Route::put('/api/admin/roles/{id}', [UserController::class, 'updateRole'])->name('admin.roles.update');
    Route::delete('/api/admin/roles/{id}', [UserController::class, 'deleteRole'])->name('admin.roles.delete');
    Route::post('/api/admin/permissions', [UserController::class, 'storePermission'])->name('admin.permissions.store');
    Route::put('/api/admin/permissions/{id}', [UserController::class, 'updatePermission'])->name('admin.permissions.update');
    Route::delete('/api/admin/permissions/{id}', [UserController::class, 'deletePermission'])->name('admin.permissions.delete');
    
    // User Activity Logs
    Route::get('/admin/activity-logs', [UserController::class, 'getActivityLogs'])->name('admin.activity-logs');
    Route::get('/api/admin/activity-logs', [UserController::class, 'getActivityLogs'])->name('admin.activity-logs.api');
    Route::get('/api/admin/activity-logs/export', [UserController::class, 'exportActivityLogs'])->name('admin.activity-logs.export')->withoutMiddleware('throttle');
    
    // Department Management
    Route::get('/admin/departments', [UserController::class, 'getDepartments'])->name('admin.departments.index');
    Route::post('/api/admin/departments', [UserController::class, 'storeDepartment'])->name('admin.departments.store');
    Route::put('/api/admin/departments/{id}', [UserController::class, 'updateDepartment'])->name('admin.departments.update');
    Route::delete('/api/admin/departments/{id}', [UserController::class, 'deleteDepartment'])->name('admin.departments.delete');
    
    // User Enrollment History (consolidated to AdminUserController)
    // Removed duplicate routes - using AdminUserController::getEnrollmentHistory (line 329)
    // Export route is part of AdminUserController suite
    
    // Reports & Compliance Routes (using AdminReportController - duplicate routes removed)
    // The main route is already defined at line ~337: Route::get('/admin/reports', [AdminReportController::class, 'index'])->name('admin.reports.index');
    Route::get('/api/admin/reports/dashboard', [AdminReportController::class, 'index'])->name('admin.reports.dashboard');
    Route::get('/admin/learner-progress', [AdminReportController::class, 'index'])->name('admin.reports.learner-progress');
    Route::get('/api/admin/reports/learner-progress', [AdminReportController::class, 'index'])->name('admin.reports.learner-progress.api');
    Route::get('/api/admin/reports/learner-progress/export', [AdminReportController::class, 'exportReport'])->name('admin.reports.learner-progress.export')->withoutMiddleware('throttle');
    Route::get('/admin/question-performance', [AdminReportController::class, 'index'])->name('admin.reports.question-performance');
    Route::get('/api/admin/reports/question-performance', [AdminReportController::class, 'index'])->name('admin.reports.question-performance.api');
    Route::get('/api/admin/reports/question-performance/export', [AdminReportController::class, 'exportReport'])->name('admin.reports.question-performance.export')->withoutMiddleware('throttle');
    Route::get('/admin/compliance-audit-trail', [AdminReportController::class, 'index'])->name('admin.reports.compliance-audit');
    Route::get('/api/admin/reports/compliance-audit', [AdminReportController::class, 'index'])->name('admin.reports.compliance-audit.api');
    Route::get('/api/admin/reports/compliance-audit/export', [AdminReportController::class, 'exportReport'])->name('admin.reports.compliance-audit.export')->withoutMiddleware('throttle');
    Route::get('/admin/comparison-report', [AdminReportController::class, 'index'])->name('admin.reports.comparison');
    Route::get('/api/admin/reports/comparison', [AdminReportController::class, 'index'])->name('admin.reports.comparison.api');
    Route::get('/api/admin/reports/comparison/export', [AdminReportController::class, 'exportReport'])->name('admin.reports.comparison.export')->withoutMiddleware('throttle');
    Route::get('/admin/custom-report-builder', [AdminReportController::class, 'index'])->name('admin.reports.custom-builder');
    Route::post('/api/admin/reports/custom', [AdminReportController::class, 'exportReport'])->name('admin.reports.custom.generate');
    // Route::get('/api/admin/reports/export/{type}', [AdminReportController::class, 'export'])->name('admin.reports.export')->withoutMiddleware('throttle'); // Already defined above
    
    // Smart Reminders Routes
    Route::get('/api/admin/reminders', [\App\Http\Controllers\Admin\ReminderController::class, 'index'])->name('admin.reminders.index');
    Route::post('/api/admin/reminders', [\App\Http\Controllers\Admin\ReminderController::class, 'store'])->name('admin.reminders.store');
    Route::put('/api/admin/reminders/{id}', [\App\Http\Controllers\Admin\ReminderController::class, 'update'])->name('admin.reminders.update');
    Route::post('/api/admin/reminders/{id}/send', [\App\Http\Controllers\Admin\ReminderController::class, 'send'])->name('admin.reminders.send');
    Route::delete('/api/admin/reminders/{id}', [\App\Http\Controllers\Admin\ReminderController::class, 'destroy'])->name('admin.reminders.destroy');
    
    // Auto Quiz Generator Routes
    Route::post('/api/admin/quizzes/generate', [\App\Http\Controllers\Admin\QuizGeneratorController::class, 'generate'])->name('admin.quizzes.generate');
    Route::get('/api/admin/quizzes/modules', [\App\Http\Controllers\Admin\QuizGeneratorController::class, 'getModules'])->name('admin.quizzes.modules');
    Route::post('/api/admin/quizzes/{id}/publish', [\App\Http\Controllers\Admin\QuizGeneratorController::class, 'publish'])->name('admin.quizzes.publish');
    
    // Smart Content Ingestion Routes
    Route::post('/api/admin/content/upload', [\App\Http\Controllers\Admin\ContentIngestionController::class, 'upload'])->name('admin.content.upload');
    Route::get('/api/admin/content/uploads', [\App\Http\Controllers\Admin\ContentIngestionController::class, 'index'])->name('admin.content.index');
    Route::get('/api/admin/content/uploads/{id}', [\App\Http\Controllers\Admin\ContentIngestionController::class, 'show'])->name('admin.content.show');
    Route::delete('/api/admin/content/uploads/{id}', [\App\Http\Controllers\Admin\ContentIngestionController::class, 'destroy'])->name('admin.content.destroy');
    
    // Notifications & Announcements Routes - UNIFIED
    Route::get('/admin/communications', function() {
        return Inertia::render('Admin/CommunicationHub');
    })->name('admin.communications.index');
    
    // Redirect old routes to new unified page
    Route::get('/admin/notifications', function() {
        return redirect('/admin/communications');
    });
    
    Route::get('/admin/announcements', function() {
        return redirect('/admin/communications');
    });

    // Advanced Analytics Pages
    Route::get('/admin/analytics', function() {
        return Inertia::render('Admin/AdvancedAnalytics');
    })->name('admin.analytics.index');

    Route::get('/admin/analytics/trends', function() {
        return Inertia::render('Admin/TrendAnalysis');
    })->name('admin.analytics.trends');
    
    // Notifications API Routes
    Route::get('/api/admin/notifications', [\App\Http\Controllers\Admin\NotificationController::class, 'index'])->name('admin.api.notifications.index');
    Route::post('/api/admin/notifications/send', [\App\Http\Controllers\Admin\NotificationController::class, 'send'])->name('admin.api.notifications.send');
    Route::post('/api/admin/notifications/preview-recipients', [\App\Http\Controllers\Admin\NotificationController::class, 'previewRecipients'])->name('admin.api.notifications.preview-recipients');
    Route::get('/api/admin/notifications/{id}', [\App\Http\Controllers\Admin\NotificationController::class, 'show'])->name('admin.api.notifications.show');
    Route::get('/api/admin/notifications/{id}/statistics', [\App\Http\Controllers\Admin\NotificationController::class, 'getStatistics'])->name('admin.api.notifications.statistics');
    Route::delete('/api/admin/notifications/{id}', [\App\Http\Controllers\Admin\NotificationController::class, 'destroy'])->name('admin.api.notifications.destroy');

    // Analytics API Routes
    Route::get('/api/admin/analytics/overview', [\App\Http\Controllers\Admin\AnalyticsController::class, 'overview'])->name('admin.api.analytics.overview');
    Route::get('/api/admin/analytics/trends', [\App\Http\Controllers\Admin\AnalyticsController::class, 'trends'])->name('admin.api.analytics.trends');
    Route::get('/api/admin/analytics/engagement', [\App\Http\Controllers\Admin\AnalyticsController::class, 'engagement'])->name('admin.api.analytics.engagement');
    Route::get('/api/admin/analytics/skills-radar', [\App\Http\Controllers\Admin\AnalyticsController::class, 'skillsRadar'])->name('admin.api.analytics.skills');
    Route::get('/api/admin/analytics/cohort', [\App\Http\Controllers\Admin\AnalyticsController::class, 'cohortAnalysis'])->name('admin.api.analytics.cohorts');
    Route::get('/api/admin/analytics/at-risk', [\App\Http\Controllers\Admin\AnalyticsController::class, 'predictiveAtRisk'])->name('admin.api.analytics.at-risk');
    Route::get('/api/admin/analytics/effectiveness', [\App\Http\Controllers\Admin\AnalyticsController::class, 'learningEffectiveness'])->name('admin.api.analytics.effectiveness');
    Route::get('/api/admin/analytics/top-performers', [UserController::class, 'getTopPerformers'])->name('admin.api.analytics.top-performers');
    
    // Leaderboard API Routes
    Route::get('/api/admin/leaderboard', [UserController::class, 'getLeaderboard'])->name('admin.api.leaderboard');
    Route::get('/api/admin/leaderboard/user/{userId}/history', [UserController::class, 'getUserHistory'])->name('admin.api.leaderboard.user-history');
    
    // Announcements API Routes
    Route::get('/api/admin/announcements', [\App\Http\Controllers\Admin\AnnouncementController::class, 'index'])->name('admin.api.announcements.index');
    Route::post('/api/admin/announcements', [\App\Http\Controllers\Admin\AnnouncementController::class, 'store'])->name('admin.api.announcements.store');
    Route::get('/api/admin/announcements/{id}', [\App\Http\Controllers\Admin\AnnouncementController::class, 'show'])->name('admin.api.announcements.show');
    Route::put('/api/admin/announcements/{id}', [\App\Http\Controllers\Admin\AnnouncementController::class, 'update'])->name('admin.api.announcements.update');
    Route::delete('/api/admin/announcements/{id}', [\App\Http\Controllers\Admin\AnnouncementController::class, 'destroy'])->name('admin.api.announcements.destroy');
    Route::patch('/api/admin/announcements/{id}/toggle-status', [\App\Http\Controllers\Admin\AnnouncementController::class, 'toggleStatus'])->name('admin.api.announcements.toggle-status');
    Route::post('/api/admin/announcements/notify', [\App\Http\Controllers\Admin\AnnouncementController::class, 'notify'])->name('admin.api.announcements.notify');
    // System test endpoint
    Route::get('/test-system/notifications-announcements', [\App\Http\Controllers\TestSystemController::class, 'testAnnouncementsNotifications']);
    
    // Command Palette Routes
    Route::post('/api/admin/commands/bulk-reminder', [\App\Http\Controllers\Admin\CommandController::class, 'sendBulkReminder'])->name('admin.commands.bulk-reminder');
    Route::post('/api/admin/commands/generate-report', [\App\Http\Controllers\Admin\CommandController::class, 'generateReport'])->name('admin.commands.generate-report');
    Route::post('/api/admin/commands/health-check', [\App\Http\Controllers\Admin\CommandController::class, 'runHealthCheck'])->name('admin.commands.health-check');
    Route::post('/api/admin/commands/backup-database', [\App\Http\Controllers\Admin\CommandController::class, 'backupDatabase'])->name('admin.commands.backup-database');
    Route::get('/api/admin/commands/search', [\App\Http\Controllers\Admin\CommandController::class, 'search'])->name('admin.commands.search');
    
    // Smart Content Ingestion Routes
    Route::post('/api/admin/smart-content/upload', [\App\Http\Controllers\Admin\SmartContentController::class, 'uploadContent'])->name('admin.smart-content.upload');
    Route::get('/api/admin/smart-content/progress/{uploadId}', [\App\Http\Controllers\Admin\SmartContentController::class, 'getUploadProgress'])->name('admin.smart-content.progress');
    Route::get('/api/admin/smart-content/uploads', [\App\Http\Controllers\Admin\SmartContentController::class, 'listUploads'])->name('admin.smart-content.uploads');
    Route::delete('/api/admin/smart-content/upload/{id}', [\App\Http\Controllers\Admin\SmartContentController::class, 'deleteUpload'])->name('admin.smart-content.delete');
    Route::post('/api/admin/smart-content/retry/{id}', [\App\Http\Controllers\Admin\SmartContentController::class, 'retryProcessing'])->name('admin.smart-content.retry');
    Route::get('/api/admin/smart-content/preview/{id}', [\App\Http\Controllers\Admin\SmartContentController::class, 'previewContent'])->name('admin.smart-content.preview');
    
    // Material routes moved to user route group (see line 279-280)
    // Route::post('/api/training/{trainingId}/material/{materialId}/bookmark', [\App\Http\Controllers\MaterialController::class, 'addBookmark'])->name('material.add-bookmark');
    // Route::delete('/api/training/{trainingId}/material/{materialId}/bookmark', [\App\Http\Controllers\MaterialController::class, 'removeBookmark'])->name('material.remove-bookmark');
    // Route::post('/api/training/{trainingId}/material/{materialId}/share', [\App\Http\Controllers\MaterialController::class, 'shareMaterial'])->name('material.share');
    // Route::get('/api/training/{trainingId}/material/{materialId}/stats', [\App\Http\Controllers\MaterialController::class, 'getSharingStats'])->name('material.stats');
    // Route::get('/api/user/bookmarks', [\App\Http\Controllers\MaterialController::class, 'getBookmarks'])->name('user.bookmarks');
});
});  // Close admin middleware group

// Include API Business Logic Routes
require __DIR__.'/api-business-logic.php';

// Include Training/Dashboard API Routes
require __DIR__.'/api_training_endpoints.php';

require __DIR__.'/auth.php';
