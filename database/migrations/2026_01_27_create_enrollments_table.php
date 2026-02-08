<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Only create if it doesn't already exist
        if (!Schema::hasTable('enrollments')) {
            Schema::create('enrollments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->foreignId('module_id')->constrained()->onDelete('cascade');
                $table->enum('status', ['enrolled', 'in_progress', 'completed', 'failed'])->default('enrolled');
                $table->integer('score')->nullable();
                $table->boolean('is_certified')->default(false);
                $table->timestamp('enrolled_at')->useCurrent();
                $table->timestamp('completed_at')->nullable();
                $table->timestamps();
                
                $table->unique(['user_id', 'module_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('enrollments');
    }
};
