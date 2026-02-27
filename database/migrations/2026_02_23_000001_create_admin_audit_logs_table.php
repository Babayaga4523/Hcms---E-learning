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
        Schema::create('admin_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('admin_id')->nullable();
            $table->string('admin_name')->nullable();
            $table->string('action'); // e.g., 'update_setting', 'delete_user', 'create_program'
            $table->string('target_type')->nullable(); // e.g., 'setting', 'user', 'program'
            $table->string('target_id')->nullable(); // ID of the affected resource
            $table->string('field_name')->nullable(); // For field-level changes (e.g., 'timezone')
            $table->longText('old_value')->nullable(); // Previous value
            $table->longText('new_value')->nullable(); // New value
            $table->json('metadata')->nullable(); // Additional context
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index('admin_id');
            $table->index('action');
            $table->index('target_type');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('admin_audit_logs');
    }
};
