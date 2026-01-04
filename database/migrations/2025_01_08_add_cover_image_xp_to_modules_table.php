<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('modules', function (Blueprint $table) {
            if (!Schema::hasColumn('modules', 'cover_image')) {
                $table->string('cover_image')->nullable()->after('presentation_url');
            }
            if (!Schema::hasColumn('modules', 'xp')) {
                $table->integer('xp')->default(0)->after('cover_image');
            }
            if (!Schema::hasColumn('modules', 'has_posttest')) {
                $table->boolean('has_posttest')->default(false)->after('has_pretest');
            }
        });
    }

    public function down(): void
    {
        Schema::table('modules', function (Blueprint $table) {
            $table->dropColumn(['cover_image', 'xp', 'has_posttest']);
        });
    }
};
