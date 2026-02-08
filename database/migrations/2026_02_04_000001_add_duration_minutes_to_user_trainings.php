<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('user_trainings', function (Blueprint $table) {
            if (!Schema::hasColumn('user_trainings', 'duration_minutes')) {
                $table->integer('duration_minutes')->nullable()->after('completed_at')->comment('Average duration of all exam attempts for this training');
            }
        });

        // Calculate duration_minutes from exam_attempts for existing records
        DB::statement("
            UPDATE user_trainings ut
            SET duration_minutes = (
                SELECT ROUND(AVG(ea.duration_minutes), 0)
                FROM exam_attempts ea
                WHERE ea.user_id = ut.user_id 
                AND ea.module_id = ut.module_id
                AND ea.duration_minutes IS NOT NULL
            )
            WHERE ut.status = 'completed'
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_trainings', function (Blueprint $table) {
            if (Schema::hasColumn('user_trainings', 'duration_minutes')) {
                $table->dropColumn('duration_minutes');
            }
        });
    }
};
