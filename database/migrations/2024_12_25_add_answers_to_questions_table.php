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
        // Add answers column to questions table if it doesn't exist
        if (Schema::hasTable('questions') && !Schema::hasColumn('questions', 'answers')) {
            Schema::table('questions', function (Blueprint $table) {
                $table->json('answers')->nullable()->after('options');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('questions') && Schema::hasColumn('questions', 'answers')) {
            Schema::table('questions', function (Blueprint $table) {
                $table->dropColumn('answers');
            });
        }
    }
};
