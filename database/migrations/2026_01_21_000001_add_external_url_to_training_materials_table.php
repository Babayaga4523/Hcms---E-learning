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
        if (!Schema::hasColumn('training_materials', 'external_url')) {
            Schema::table('training_materials', function (Blueprint $table) {
                $table->string('external_url')->nullable()->after('file_path');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('training_materials', 'external_url')) {
            Schema::table('training_materials', function (Blueprint $table) {
                $table->dropColumn('external_url');
            });
        }
    }
};