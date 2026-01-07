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
        // User Learning Goals
        Schema::create('learning_goals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->integer('target_value')->default(1);
            $table->integer('current_progress')->default(0);
            $table->string('unit')->default('courses'); // courses, hours, quizzes, modules, points
            $table->string('period')->default('weekly'); // weekly, monthly, custom
            $table->string('status')->default('active'); // active, completed, expired
            $table->integer('points')->default(100);
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        // User Milestones/Achievements
        Schema::create('user_milestones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('key'); // milestone identifier (unique per user)
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('icon')->nullable();
            $table->integer('points')->default(0);
            $table->boolean('achieved')->default(false);
            $table->timestamp('achieved_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'key']); // Each user can have each milestone only once
        });

        // Milestone definitions (system-wide)
        Schema::create('milestone_definitions', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('icon')->nullable();
            $table->integer('points')->default(100);
            $table->string('requirement_type'); // courses_completed, hours_studied, quizzes_passed, etc.
            $table->integer('requirement_value')->default(1);
            $table->integer('order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('milestone_definitions');
        Schema::dropIfExists('user_milestones');
        Schema::dropIfExists('learning_goals');
    }
};
