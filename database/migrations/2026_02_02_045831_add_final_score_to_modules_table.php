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
            // Add final_score column if it doesn't exist
            if (!Schema::hasColumn('modules', 'final_score')) {
                $table->decimal('final_score', 5, 2)->nullable()->default(0)->after('category');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('modules', function (Blueprint $table) {
            if (Schema::hasColumn('modules', 'final_score')) {
                $table->dropColumn('final_score');
            }
        });
    }
};
