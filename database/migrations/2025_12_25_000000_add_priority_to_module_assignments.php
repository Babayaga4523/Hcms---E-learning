<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('module_assignments', function (Blueprint $table) {
            if (!Schema::hasColumn('module_assignments', 'priority')) {
                $table->enum('priority', ['low', 'normal', 'high', 'urgent'])->default('normal')->after('status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('module_assignments', function (Blueprint $table) {
            if (Schema::hasColumn('module_assignments', 'priority')) {
                $table->dropColumn('priority');
            }
        });
    }
};
