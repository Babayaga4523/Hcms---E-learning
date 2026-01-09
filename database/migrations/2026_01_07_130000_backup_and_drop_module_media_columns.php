<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Create backup table
        if (!Schema::hasTable('modules_media_backup')) {
            Schema::create('modules_media_backup', function (Blueprint $table) {
                $table->id();
                $table->foreignId('module_id')->constrained('modules')->onDelete('cascade');
                $table->string('video_url')->nullable();
                $table->string('document_url')->nullable();
                $table->string('presentation_url')->nullable();
                $table->timestamps();
            });
        }

        // Copy existing media fields into backup
        if (Schema::hasColumn('modules', 'video_url') || Schema::hasColumn('modules', 'document_url') || Schema::hasColumn('modules', 'presentation_url')) {
            $modules = DB::table('modules')->select('id', 'video_url', 'document_url', 'presentation_url')->get();
            $now = now();
            $rows = [];
            foreach ($modules as $m) {
                // Only insert if any of the columns has data (to reduce noise)
                if ($m->video_url || $m->document_url || $m->presentation_url) {
                    $rows[] = [
                        'module_id' => $m->id,
                        'video_url' => $m->video_url,
                        'document_url' => $m->document_url,
                        'presentation_url' => $m->presentation_url,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }
            }
            if (!empty($rows)) {
                DB::table('modules_media_backup')->insert($rows);
            }

            // Drop the columns from modules
            Schema::table('modules', function (Blueprint $table) {
                if (Schema::hasColumn('modules', 'video_url')) {
                    $table->dropColumn('video_url');
                }
                if (Schema::hasColumn('modules', 'document_url')) {
                    $table->dropColumn('document_url');
                }
                if (Schema::hasColumn('modules', 'presentation_url')) {
                    $table->dropColumn('presentation_url');
                }
            });
        }
    }

    public function down(): void
    {
        // Add columns back to modules if they don't exist
        Schema::table('modules', function (Blueprint $table) {
            if (!Schema::hasColumn('modules', 'video_url')) {
                $table->string('video_url')->nullable()->after('description');
            }
            if (!Schema::hasColumn('modules', 'document_url')) {
                $table->string('document_url')->nullable()->after('video_url');
            }
            if (!Schema::hasColumn('modules', 'presentation_url')) {
                $table->string('presentation_url')->nullable()->after('document_url');
            }
        });

        // Restore data from backup
        if (Schema::hasTable('modules_media_backup')) {
            $backups = DB::table('modules_media_backup')->get();
            foreach ($backups as $b) {
                DB::table('modules')->where('id', $b->module_id)->update([
                    'video_url' => $b->video_url,
                    'document_url' => $b->document_url,
                    'presentation_url' => $b->presentation_url,
                ]);
            }

            // Drop backup table
            Schema::dropIfExists('modules_media_backup');
        }
    }
};