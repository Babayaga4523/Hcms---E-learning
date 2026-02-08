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
        Schema::table('certificates', function (Blueprint $table) {
            // Cek apakah index sudah ada sebelum membuat
            // Unique index pada (user_id, module_id) untuk prevent race condition
            // Ini adalah benteng terakhir melawan duplikasi certificate
            if (!Schema::hasIndex('certificates', 'certificates_user_id_module_id_unique')) {
                $table->unique(['user_id', 'module_id'], 'certificates_user_id_module_id_unique');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('certificates', function (Blueprint $table) {
            // Drop unique index jika ada
            $table->dropUnique('certificates_user_id_module_id_unique');
        });
    }
};
