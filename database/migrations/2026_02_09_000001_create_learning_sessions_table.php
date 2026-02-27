<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * This table tracks actual time spent by learners on modules
     * Each session records when user starts and stops learning activity
     */
    public function up(): void
    {
        Schema::create('learning_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('module_id')->constrained()->onDelete('cascade');
            $table->foreignId('material_id')->nullable()->constrained('training_materials')->onDelete('set null');
            
            // Session timing
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('ended_at')->nullable();
            
            // Activity type: material, pretest, posttest, review
            $table->enum('activity_type', ['material', 'pretest', 'posttest', 'review', 'quiz', 'other'])->default('material');
            
            // Is session active (not yet ended)
            $table->boolean('is_active')->default(true);
            
            // Session duration in minutes (calculated when ended)
            $table->integer('duration_minutes')->nullable();
            
            // Learning activity metadata
            $table->json('metadata')->nullable(); // Store additional data: device, ip, etc
            
            // Indexes for fast queries
            $table->index(['user_id', 'created_at']);
            $table->index(['module_id', 'created_at']);
            $table->index(['is_active']);
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('learning_sessions');
    }
};
