<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_material_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('training_material_id')->constrained('training_materials')->onDelete('cascade');
            $table->boolean('is_completed')->default(false);
            $table->integer('last_position_seconds')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'training_material_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_material_progress');
    }
};