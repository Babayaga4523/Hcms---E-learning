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
        Schema::table('user_trainings', function (Blueprint $table) {
            $table->unsignedBigInteger('certificate_id')->nullable()->after('module_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_trainings', function (Blueprint $table) {
            $table->dropColumn('certificate_id');
        });
    }
};
