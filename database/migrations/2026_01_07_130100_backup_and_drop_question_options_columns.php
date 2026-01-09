<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Create backup table for question options
        if (!Schema::hasTable('question_options_backup')) {
            Schema::create('question_options_backup', function (Blueprint $table) {
                $table->id();
                $table->foreignId('question_id')->constrained('questions')->onDelete('cascade');
                $table->string('option_a')->nullable();
                $table->string('option_b')->nullable();
                $table->string('option_c')->nullable();
                $table->string('option_d')->nullable();
                $table->timestamps();
            });
        }

        // Copy existing options into backup
        if (Schema::hasColumn('questions', 'option_a') || Schema::hasColumn('questions', 'option_b')) {
            $questions = DB::table('questions')->select('id', 'option_a', 'option_b', 'option_c', 'option_d')->get();
            $now = now();
            $rows = [];
            foreach ($questions as $q) {
                if ($q->option_a || $q->option_b || $q->option_c || $q->option_d) {
                    $rows[] = [
                        'question_id' => $q->id,
                        'option_a' => $q->option_a,
                        'option_b' => $q->option_b,
                        'option_c' => $q->option_c,
                        'option_d' => $q->option_d,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }
            }
            if (!empty($rows)) {
                DB::table('question_options_backup')->insert($rows);
            }

            // Drop option columns
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
    }

    public function down(): void
    {
        // Add columns back
        Schema::table('questions', function (Blueprint $table) {
            if (!Schema::hasColumn('questions', 'option_a')) {
                $table->string('option_a')->nullable()->after('explanation');
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

        // Restore data
        if (Schema::hasTable('question_options_backup')) {
            $backs = DB::table('question_options_backup')->get();
            foreach ($backs as $b) {
                DB::table('questions')->where('id', $b->question_id)->update([
                    'option_a' => $b->option_a,
                    'option_b' => $b->option_b,
                    'option_c' => $b->option_c,
                    'option_d' => $b->option_d,
                ]);
            }

            Schema::dropIfExists('question_options_backup');
        }
    }
};