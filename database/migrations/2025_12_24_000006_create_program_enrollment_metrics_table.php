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
        Schema::create('program_enrollment_metrics', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('module_id');
            $table->date('metric_date');
            $table->integer('total_enrolled')->default(0);
            $table->integer('completed')->default(0);
            $table->integer('in_progress')->default(0);
            $table->integer('not_started')->default(0);
            $table->decimal('average_score', 5, 2)->default(0);
            $table->timestamps();
            
            $table->foreign('module_id')->references('id')->on('modules')->onDelete('cascade');
            $table->unique(['module_id', 'metric_date']);
            $table->index('metric_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('program_enrollment_metrics');
    }
};
