<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adds `progress` (int default 0) and `last_activity_at` (nullable timestamp)
     * and backfills `last_activity_at` with `updated_at` for existing rows.
     */
    public function up()
    {
        // Add columns if they don't exist
        Schema::table('user_trainings', function (Blueprint $table) {
            if (!Schema::hasColumn('user_trainings', 'progress')) {
                // unsigned integer enough for 0-100
                $table->unsignedInteger('progress')->default(0)->after('status');
            }
            if (!Schema::hasColumn('user_trainings', 'last_activity_at')) {
                $table->timestamp('last_activity_at')->nullable()->after('updated_at');
            }
        });

        // Backfill last_activity_at from updated_at where null (safe operation)
        if (Schema::hasColumn('user_trainings', 'last_activity_at')) {
            DB::table('user_trainings')
                ->whereNull('last_activity_at')
                ->update(['last_activity_at' => DB::raw('updated_at')]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::table('user_trainings', function (Blueprint $table) {
            if (Schema::hasColumn('user_trainings', 'progress')) {
                // dropColumn may not be supported on older SQLite schemas, but it's standard for MySQL/Postgres
                $table->dropColumn('progress');
            }
            if (Schema::hasColumn('user_trainings', 'last_activity_at')) {
                $table->dropColumn('last_activity_at');
            }
        });
    }
};
