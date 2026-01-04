<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add new columns to modules table for advanced features
        Schema::table('modules', function (Blueprint $table) {
            // Expiry & Prerequisites
            if (!Schema::hasColumn('modules', 'expiry_date')) {
                $table->date('expiry_date')->nullable()->after('is_active');
            }
            if (!Schema::hasColumn('modules', 'prerequisite_module_id')) {
                $table->foreignId('prerequisite_module_id')->nullable()->constrained('modules')->onDelete('set null')->after('expiry_date');
            }
            
            // Assignment & Duration
            if (!Schema::hasColumn('modules', 'target_departments')) {
                $table->json('target_departments')->nullable()->after('prerequisite_module_id'); // JSON array of departments
            }
            if (!Schema::hasColumn('modules', 'duration_minutes')) {
                $table->integer('duration_minutes')->default(60)->after('target_departments');
            }
            
            // Advanced Settings
            if (!Schema::hasColumn('modules', 'allow_retake')) {
                $table->boolean('allow_retake')->default(true)->after('duration_minutes');
            }
            if (!Schema::hasColumn('modules', 'max_retake_attempts')) {
                $table->integer('max_retake_attempts')->default(3)->after('allow_retake');
            }
            if (!Schema::hasColumn('modules', 'category')) {
                $table->string('category')->nullable()->after('max_retake_attempts');
            }
            if (!Schema::hasColumn('modules', 'instructor_id')) {
                $table->foreignId('instructor_id')->nullable()->constrained('users')->onDelete('set null')->after('category');
            }
            if (!Schema::hasColumn('modules', 'certificate_template')) {
                $table->text('certificate_template')->nullable()->after('instructor_id');
            }
        });

        // Create new table for question banks (share questions across modules)
        Schema::create('question_banks', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedBigInteger('created_by');
            $table->timestamps();
            
            $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
        });

        // Create pivot table for question_bank_questions
        Schema::create('question_bank_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_bank_id')->constrained('question_banks')->onDelete('cascade');
            $table->foreignId('question_id')->constrained('questions')->onDelete('cascade');
            $table->timestamps();
            
            $table->unique(['question_bank_id', 'question_id']);
        });

        // Update questions table for advanced features
        Schema::table('questions', function (Blueprint $table) {
            if (!Schema::hasColumn('questions', 'difficulty')) {
                $table->enum('difficulty', ['easy', 'medium', 'hard'])->default('medium')->after('correct_answer');
            }
            if (!Schema::hasColumn('questions', 'explanation')) {
                $table->text('explanation')->nullable()->after('difficulty');
            }
            if (!Schema::hasColumn('questions', 'question_type')) {
                $table->enum('question_type', ['multiple_choice', 'true_false', 'short_answer'])->default('multiple_choice')->after('explanation');
            }
        });

        // Create materials table for training resources
        Schema::create('training_materials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->constrained('modules')->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('file_type'); // 'video', 'pdf', 'ppt', 'document'
            $table->string('file_path');
            $table->string('file_name');
            $table->integer('file_size'); // in bytes
            $table->integer('duration_minutes')->default(0); // for videos
            $table->integer('order')->default(0);
            $table->integer('version')->default(1);
            $table->foreignId('uploaded_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });

        // Create user assignment table
        Schema::create('module_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->constrained('modules')->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('cascade');
            $table->string('department')->nullable(); // assign to entire department
            $table->date('assigned_date');
            $table->date('due_date')->nullable();
            $table->enum('status', ['pending', 'in_progress', 'completed'])->default('pending');
            $table->timestamps();
            
            $table->index(['module_id', 'user_id']);
        });

        // Create discussion/QA table
        Schema::create('training_discussions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->constrained('modules')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->text('question');
            $table->text('answer')->nullable();
            $table->foreignId('answered_by')->nullable()->constrained('users')->onDelete('set null');
            $table->integer('helpful_count')->default(0);
            $table->boolean('is_pinned')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('training_discussions');
        Schema::dropIfExists('module_assignments');
        Schema::dropIfExists('training_materials');
        Schema::dropIfExists('question_bank_questions');
        Schema::dropIfExists('question_banks');
        
        Schema::table('questions', function (Blueprint $table) {
            if (Schema::hasColumn('questions', 'difficulty')) {
                $table->dropColumn('difficulty');
            }
            if (Schema::hasColumn('questions', 'explanation')) {
                $table->dropColumn('explanation');
            }
            if (Schema::hasColumn('questions', 'question_type')) {
                $table->dropColumn('question_type');
            }
        });

        Schema::table('modules', function (Blueprint $table) {
            if (Schema::hasColumn('modules', 'expiry_date')) {
                $table->dropColumn('expiry_date');
            }
            if (Schema::hasColumn('modules', 'prerequisite_module_id')) {
                $table->dropForeign(['prerequisite_module_id']);
                $table->dropColumn('prerequisite_module_id');
            }
            if (Schema::hasColumn('modules', 'target_departments')) {
                $table->dropColumn('target_departments');
            }
            if (Schema::hasColumn('modules', 'duration_minutes')) {
                $table->dropColumn('duration_minutes');
            }
            if (Schema::hasColumn('modules', 'allow_retake')) {
                $table->dropColumn('allow_retake');
            }
            if (Schema::hasColumn('modules', 'max_retake_attempts')) {
                $table->dropColumn('max_retake_attempts');
            }
            if (Schema::hasColumn('modules', 'category')) {
                $table->dropColumn('category');
            }
            if (Schema::hasColumn('modules', 'instructor_id')) {
                $table->dropForeign(['instructor_id']);
                $table->dropColumn('instructor_id');
            }
            if (Schema::hasColumn('modules', 'certificate_template')) {
                $table->dropColumn('certificate_template');
            }
        });
    }
};
