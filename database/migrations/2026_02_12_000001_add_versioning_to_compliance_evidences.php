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
        // Add version column to compliance_evidences table
        Schema::table('compliance_evidences', function (Blueprint $table) {
            $table->unsignedInteger('version')->default(1)->after('status');
            $table->boolean('is_current_version')->default(true)->after('version');
        });

        // Create evidence history table for tracking all versions
        Schema::create('compliance_evidence_history', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('evidence_id');
            $table->unsignedInteger('version');
            $table->string('evidence_type');
            $table->string('file_path')->nullable();
            $table->text('description')->nullable();
            $table->string('status'); // pending, verified, rejected
            $table->timestamp('verified_at')->nullable();
            $table->unsignedBigInteger('verified_by')->nullable();
            $table->text('verification_notes')->nullable();
            $table->unsignedBigInteger('changed_by'); // Who made the change
            $table->text('change_notes')->nullable(); // Why the version was created
            $table->timestamps();
            
            $table->foreign('evidence_id')->references('id')->on('compliance_evidences')->onDelete('cascade');
            $table->foreign('changed_by')->references('id')->on('users')->onDelete('restrict');
            $table->index(['evidence_id', 'version']);
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('compliance_evidence_history');
        
        Schema::table('compliance_evidences', function (Blueprint $table) {
            $table->dropColumn(['version', 'is_current_version']);
        });
    }
};
