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
        Schema::create('announcements', function (Blueprint $table) {
            $table->id();
            $table->string('title')->index();
            $table->longText('content');
            $table->enum('type', ['general', 'urgent', 'maintenance', 'event'])->default('general');
            $table->enum('status', ['active', 'inactive', 'scheduled'])->default('active');
            $table->dateTime('start_date')->nullable();
            $table->dateTime('end_date')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->enum('display_type', ['banner', 'modal', 'notification'])->default('banner');
            $table->timestamps();
            
            // Indexes
            $table->index('status');
            $table->index('type');
            $table->index('is_featured');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('announcements');
    }
};
