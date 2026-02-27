<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            // Add scheduling related columns if they don't exist
            if (!Schema::hasColumn('announcements', 'schedule_timezone')) {
                $table->string('schedule_timezone')->default('UTC')->after('display_type');
            }
            if (!Schema::hasColumn('announcements', 'repeat_schedule')) {
                $table->string('repeat_schedule')->default('none')->after('schedule_timezone');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            if (Schema::hasColumn('announcements', 'schedule_timezone')) {
                $table->dropColumn('schedule_timezone');
            }
            if (Schema::hasColumn('announcements', 'repeat_schedule')) {
                $table->dropColumn('repeat_schedule');
            }
        });
    }
};
