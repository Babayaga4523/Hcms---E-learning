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
        // Tags Table - For skill/topic categorization
        Schema::create('tags', function (Blueprint $table) {
            $table->id();
            $table->string('tag_name')->unique();
            $table->string('description')->nullable();
            $table->string('color')->default('#005E54'); // For UI visualization
            $table->timestamps();
        });

        // Module Tags Pivot Table
        Schema::create('module_tags', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->constrained()->onDelete('cascade');
            $table->foreignId('tag_id')->constrained()->onDelete('cascade');
            $table->timestamps();
            
            $table->unique(['module_id', 'tag_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('module_tags');
        Schema::dropIfExists('tags');
    }
};
