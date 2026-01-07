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
        Schema::table('questions', function (Blueprint $table) {
            if (!Schema::hasColumn('questions', 'quiz_id')) {
                $table->foreignId('quiz_id')->nullable()->constrained('quizzes')->onDelete('cascade')->after('module_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            if (Schema::hasColumn('questions', 'quiz_id')) {
                $table->dropForeign(['quiz_id']);
                $table->dropColumn('quiz_id');
            }
        });
    }
};
