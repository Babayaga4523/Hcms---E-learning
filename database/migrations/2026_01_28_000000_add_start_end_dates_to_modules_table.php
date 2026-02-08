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
        Schema::table('modules', function (Blueprint $table) {
            // Add start and end date columns for program scheduling
            if (!Schema::hasColumn('modules', 'start_date')) {
                $table->dateTime('start_date')->nullable()->after('expiry_date')->comment('Tanggal dan waktu program dimulai');
            }
            if (!Schema::hasColumn('modules', 'end_date')) {
                $table->dateTime('end_date')->nullable()->after('start_date')->comment('Tanggal dan waktu program berakhir');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('modules', function (Blueprint $table) {
            $table->dropColumn(['start_date', 'end_date']);
        });
    }
};
