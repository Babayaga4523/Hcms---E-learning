<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            if (!Schema::hasColumn('questions', 'option_a')) {
                $table->string('option_a')->nullable()->after('question_text');
            }
            if (!Schema::hasColumn('questions', 'option_b')) {
                $table->string('option_b')->nullable()->after('option_a');
            }
            if (!Schema::hasColumn('questions', 'option_c')) {
                $table->string('option_c')->nullable()->after('option_b');
            }
            if (!Schema::hasColumn('questions', 'option_d')) {
                $table->string('option_d')->nullable()->after('option_c');
            }
        });
    }

    public function down(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            if (Schema::hasColumn('questions', 'option_a')) {
                $table->dropColumn('option_a');
            }
            if (Schema::hasColumn('questions', 'option_b')) {
                $table->dropColumn('option_b');
            }
            if (Schema::hasColumn('questions', 'option_c')) {
                $table->dropColumn('option_c');
            }
            if (Schema::hasColumn('questions', 'option_d')) {
                $table->dropColumn('option_d');
            }
        });
    }
};
