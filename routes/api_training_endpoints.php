<?php

// routes/api.php - Add these routes for Training Calendar API

use App\Http\Controllers\API\UserTrainingController;
use App\Http\Controllers\User\DashboardController;
use Illuminate\Support\Facades\Route;

Route::prefix('api')->middleware(['api', 'auth:sanctum'])->group(function () {
    
    // 🎯 DASHBOARD - New features endpoints
    // GET /api/user/leaderboard/monthly
    Route::get('/user/leaderboard/monthly', [DashboardController::class, 'getMonthlyLeaderboard']);
    
    // GET /api/user/dashboard/statistics
    Route::get('/user/dashboard/statistics', [DashboardController::class, 'getLearningStatistics']);
    
    // GET /api/user/dashboard/goals
    Route::get('/user/dashboard/goals', [DashboardController::class, 'getGoals']);
    
    // ️⚡ LIGHTWEIGHT CALENDAR - Main endpoint
    // GET /api/user/training-schedules
    // Returns: All user trainings, cached for 1 hour
    // Used by: TrainingCalendarLight.jsx
    Route::get('/user/training-schedules', [UserTrainingController::class, 'getSchedules']);

    // ⚡ Optional: Paginated endpoint (for original heavy calendar)
    // GET /api/user/training-schedules?page=1&per_page=100
    Route::get('/user/training-schedules/paginated', [UserTrainingController::class, 'getSchedulesPaginated']);

    // 🔍 Search endpoint
    // GET /api/user/training-schedules/search?q=python
    Route::get('/user/training-schedules/search', [UserTrainingController::class, 'searchSchedules']);

    // 📅 Month specific endpoint
    // GET /api/user/training-schedules/month?year=2026&month=2
    Route::get('/user/training-schedules/month', [UserTrainingController::class, 'getSchedulesByMonth']);

    // 🚀 Upcoming endpoint
    // GET /api/user/training-schedules/upcoming?days=30
    Route::get('/user/training-schedules/upcoming', [UserTrainingController::class, 'getUpcomingSchedules']);

    // ✅ Mark as completed
    // POST /api/user/training-schedules/:id/complete
    Route::post('/user/training-schedules/{id}/complete', [UserTrainingController::class, 'markCompleted']);

    // 📝 CRUD operations
    Route::post('/user/training-schedules', [UserTrainingController::class, 'store']);
    Route::put('/user/training-schedules/{id}', [UserTrainingController::class, 'update']);
    Route::delete('/user/training-schedules/{id}', [UserTrainingController::class, 'destroy']);
});
