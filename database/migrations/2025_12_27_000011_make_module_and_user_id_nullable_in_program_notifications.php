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
        Schema::table('program_notifications', function (Blueprint $table) {
            // Make module_id and user_id nullable for broadcast notifications
            $table->unsignedBigInteger('module_id')->nullable()->change();
            $table->unsignedBigInteger('user_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Cannot revert to NOT NULL if NULL values exist, so just do nothing
        // This prevents rolling back from breaking the schema
    }
};
