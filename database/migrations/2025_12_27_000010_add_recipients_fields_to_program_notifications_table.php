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
            // Add fields used by the admin notification system
            $table->string('recipients')->default('all')->after('message');
            $table->json('recipient_ids')->nullable()->after('recipients');
            $table->boolean('is_scheduled')->default(false)->after('recipient_ids');
            $table->timestamp('scheduled_at')->nullable()->after('is_scheduled');
            $table->integer('recipients_count')->default(0)->after('scheduled_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('program_notifications', function (Blueprint $table) {
            $table->dropColumn([
                'recipients',
                'recipient_ids',
                'is_scheduled',
                'scheduled_at',
                'recipients_count',
            ]);
        });
    }
};
