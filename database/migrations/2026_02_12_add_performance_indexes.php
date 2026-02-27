<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations - Add indexes for dashboard query optimization
     */
    public function up(): void
    {
        // Index user_trainings for dashboard queries
        Schema::table('user_trainings', function (Blueprint $table) {
            $table->index('status', 'idx_user_trainings_status');
            $table->index('is_certified', 'idx_user_trainings_certified');
            $table->index(['user_id', 'status'], 'idx_user_trainings_user_status');
            $table->index(['created_at', 'is_certified'], 'idx_user_trainings_date_certified');
            $table->index(['user_id', 'final_score'], 'idx_user_trainings_user_score');
        });

        // Index modules for active program queries
        Schema::table('modules', function (Blueprint $table) {
            $table->index('is_active', 'idx_modules_active');
        });

        // Index users for department and role queries
        Schema::table('users', function (Blueprint $table) {
            $table->index('role', 'idx_users_role');
            $table->index('department', 'idx_users_department');
            $table->index(['role', 'department'], 'idx_users_role_dept');
            $table->index('status', 'idx_users_status');
        });
    }

    /**
     * Reverse the migrations
     */
    public function down(): void
    {
        Schema::table('user_trainings', function (Blueprint $table) {
            $table->dropIndex('idx_user_trainings_status');
            $table->dropIndex('idx_user_trainings_certified');
            $table->dropIndex('idx_user_trainings_user_status');
            $table->dropIndex('idx_user_trainings_date_certified');
            $table->dropIndex('idx_user_trainings_user_score');
        });

        Schema::table('modules', function (Blueprint $table) {
            $table->dropIndex('idx_modules_active');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('idx_users_role');
            $table->dropIndex('idx_users_department');
            $table->dropIndex('idx_users_role_dept');
            $table->dropIndex('idx_users_status');
        });
    }
};
