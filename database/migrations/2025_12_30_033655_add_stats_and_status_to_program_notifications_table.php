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
            $table->string('status')->default('sent')->after('type'); // sent, scheduled, draft
            $table->json('stats')->nullable()->after('recipients_count'); // {sent: 0, read: 0, clicked: 0}
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('program_notifications', function (Blueprint $table) {
            $table->dropColumn(['status', 'stats']);
        });
    }
};
