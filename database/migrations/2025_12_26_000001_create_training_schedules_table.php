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
        Schema::create('training_schedules', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->date('date');
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->string('location')->nullable();
            $table->text('description')->nullable();
            $table->foreignId('program_id')->nullable()->constrained('modules')->onDelete('set null');
            $table->string('type')->default('training'); // training, deadline, reminder, event
            $table->integer('capacity')->nullable();
            $table->integer('enrolled')->default(0);
            $table->string('status')->default('scheduled'); // scheduled, ongoing, completed, cancelled
            $table->timestamps();
            
            $table->index('date');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('training_schedules');
    }
};
