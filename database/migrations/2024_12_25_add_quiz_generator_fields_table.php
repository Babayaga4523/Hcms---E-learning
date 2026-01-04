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
        // Create quizzes table if it doesn't exist
        if (!Schema::hasTable('quizzes')) {
            Schema::create('quizzes', function (Blueprint $table) {
                $table->id();
                $table->string('title')->nullable();
                $table->string('name');
                $table->enum('type', ['pretest', 'posttest'])->default('posttest');
                $table->text('description')->nullable();
                $table->integer('passing_score')->default(60);
                $table->integer('time_limit')->nullable();
                $table->boolean('show_answers')->default(true);
                $table->boolean('is_active')->default(true);
                $table->enum('difficulty', ['easy', 'medium', 'hard'])->default('medium');
                $table->integer('question_count')->default(0);
                $table->enum('status', ['generating', 'generated', 'published', 'archived'])->default('published');
                $table->integer('quality_score')->default(0);
                $table->integer('coverage_score')->default(0);
                $table->foreignId('module_id')->nullable()->constrained('modules')->onDelete('cascade');
                $table->foreignId('training_program_id')->nullable()->constrained('training_programs')->onDelete('cascade');
                $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
                $table->foreignId('published_by')->nullable()->constrained('users')->onDelete('set null');
                $table->timestamp('published_at')->nullable();
                $table->timestamps();
            });
        } else {
            // If table exists, just add missing columns
            Schema::table('quizzes', function (Blueprint $table) {
                if (!Schema::hasColumn('quizzes', 'title')) {
                    $table->string('title')->nullable()->after('name');
                }
                if (!Schema::hasColumn('quizzes', 'difficulty')) {
                    $table->enum('difficulty', ['easy', 'medium', 'hard'])->default('medium')->after('type');
                }
                if (!Schema::hasColumn('quizzes', 'question_count')) {
                    $table->integer('question_count')->default(0)->after('difficulty');
                }
                if (!Schema::hasColumn('quizzes', 'status')) {
                    $table->enum('status', ['generating', 'generated', 'published', 'archived'])->default('published')->after('is_active');
                }
                if (!Schema::hasColumn('quizzes', 'quality_score')) {
                    $table->integer('quality_score')->default(0)->after('status');
                }
                if (!Schema::hasColumn('quizzes', 'coverage_score')) {
                    $table->integer('coverage_score')->default(0)->after('quality_score');
                }
                if (!Schema::hasColumn('quizzes', 'training_program_id')) {
                    $table->foreignId('training_program_id')->nullable()->after('module_id')->constrained('training_programs')->onDelete('cascade');
                }
                if (!Schema::hasColumn('quizzes', 'created_by')) {
                    $table->foreignId('created_by')->nullable()->after('coverage_score')->constrained('users')->onDelete('set null');
                }
                if (!Schema::hasColumn('quizzes', 'published_by')) {
                    $table->foreignId('published_by')->nullable()->after('created_by')->constrained('users')->onDelete('set null');
                }
                if (!Schema::hasColumn('quizzes', 'published_at')) {
                    $table->timestamp('published_at')->nullable()->after('published_by');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('quizzes')) {
            Schema::table('quizzes', function (Blueprint $table) {
                $table->dropColumnIfExists(['title', 'training_program_id', 'difficulty', 'question_count', 'status', 'quality_score', 'coverage_score', 'created_by', 'published_by', 'published_at']);
            });
        }
    }
};
