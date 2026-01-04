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
            // Update enum untuk menambahkan pretest dan posttest
            // Note: SQLite tidak support ALTER ENUM, jadi kita harus recreate column
            $table->dropColumn('question_type');
        });

        Schema::table('questions', function (Blueprint $table) {
            $table->enum('question_type', ['multiple_choice', 'true_false', 'short_answer', 'pretest', 'posttest'])
                ->default('multiple_choice')
                ->after('explanation');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->dropColumn('question_type');
        });

        Schema::table('questions', function (Blueprint $table) {
            $table->enum('question_type', ['multiple_choice', 'true_false', 'short_answer'])
                ->default('multiple_choice')
                ->after('explanation');
        });
    }
};
