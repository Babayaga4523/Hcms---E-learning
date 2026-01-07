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
        Schema::create('certificates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('module_id')->constrained()->onDelete('cascade');
            $table->string('certificate_number')->unique();
            $table->string('user_name');
            $table->string('training_title');
            $table->integer('score')->default(0);
            $table->integer('materials_completed')->default(0);
            $table->integer('hours')->default(0);
            $table->timestamp('issued_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->string('instructor_name')->nullable();
            $table->string('status')->default('active'); // active, revoked
            $table->text('metadata')->nullable(); // JSON for additional data
            $table->timestamps();
            
            // Index for faster lookups
            $table->index(['user_id', 'module_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('certificates');
    }
};
