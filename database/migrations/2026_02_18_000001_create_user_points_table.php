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
        // Create user_points table to track point history
        Schema::create('user_points', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('activity_type'); // 'module_completion', 'certification', 'exam_passed', 'exam_attempt'
            $table->integer('points')->default(0);
            $table->foreignId('module_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('exam_attempt_id')->nullable()->constrained()->onDelete('set null');
            $table->text('description')->nullable();
            $table->json('metadata')->nullable(); // for additional info, e.g., exam_score, difficulty
            $table->timestamps();

            $table->index(['user_id', 'activity_type']);
            $table->index('created_at');
        });

        // Add total_points column to users table if it doesn't exist
        if (Schema::hasTable('users') && !Schema::hasColumn('users', 'total_points')) {
            Schema::table('users', function (Blueprint $table) {
                $table->integer('total_points')->default(0)->after('email_verified_at');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_points');
        
        if (Schema::hasTable('users') && Schema::hasColumn('users', 'total_points')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('total_points');
            });
        }
    }
};
