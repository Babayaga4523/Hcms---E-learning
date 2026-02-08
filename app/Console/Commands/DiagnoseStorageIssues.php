<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class DiagnoseStorageIssues extends Command
{
    protected $signature = 'diagnose:storage';
    protected $description = 'Diagnose storage and database issues';

    public function handle()
    {
        $this->line('=== HCMS E-Learning Storage Diagnostic Report ===');
        $this->line('Generated: ' . date('Y-m-d H:i:s'));
        $this->newLine();

        // 1. Check Storage Configuration
        $this->info('1. STORAGE CONFIGURATION');
        $this->line('├─ Filesystem Disk: ' . config('filesystems.default'));
        $this->line('├─ Public Disk Root: ' . Storage::disk('public')->path(''));
        $this->line('├─ Storage Link Exists: ' . (is_link(public_path('storage')) ? 'YES' : 'NO'));
        if (is_link(public_path('storage'))) {
            $this->line('└─ Storage Link Target: ' . readlink(public_path('storage')));
        }

        // 2. Check Questions Directory
        $this->newLine();
        $this->info('2. QUESTIONS DIRECTORY');
        $questionsDir = storage_path('app/public/questions');
        $this->line('├─ Directory Path: ' . $questionsDir);
        $this->line('├─ Exists: ' . (is_dir($questionsDir) ? 'YES' : 'NO'));
        if (is_dir($questionsDir)) {
            $files = array_slice(scandir($questionsDir), 2);
            $this->line('├─ Total Files: ' . count($files));
            if (count($files) > 0) {
                $this->line('├─ Sample Files:');
                foreach (array_slice($files, 0, 5) as $f) {
                    $size = filesize("$questionsDir/$f");
                    $this->line('│  ├─ ' . $f . ' (' . $size . ' bytes)');
                }
            }
        }

        // 3. Check Materials Directory
        $this->newLine();
        $this->info('3. MATERIALS DIRECTORY');
        $materialsDir = storage_path('app/public/materials');
        $this->line('├─ Directory Path: ' . $materialsDir);
        $this->line('├─ Exists: ' . (is_dir($materialsDir) ? 'YES' : 'NO'));
        if (is_dir($materialsDir)) {
            $files = array_slice(scandir($materialsDir), 2);
            $this->line('├─ Total Files: ' . count($files));
            if (count($files) > 0) {
                $this->line('├─ Sample Files:');
                foreach (array_slice($files, 0, 5) as $f) {
                    $size = filesize("$materialsDir/$f");
                    $this->line('│  ├─ ' . $f . ' (' . $size . ' bytes)');
                }
            }
        }

        // 4. Check Database Questions with Images
        $this->newLine();
        $this->info('4. DATABASE - QUESTIONS WITH IMAGES');
        $questionsWithImages = DB::table('questions')
            ->whereNotNull('image_url')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get(['id', 'quiz_id', 'module_id', 'image_url', 'created_at']);

        $totalWithImages = DB::table('questions')->whereNotNull('image_url')->count();
        $this->line('├─ Total Questions with Images: ' . $totalWithImages);
        if ($questionsWithImages->count() > 0) {
            $this->line('├─ Recent Samples (first 5):');
            foreach ($questionsWithImages as $q) {
                $this->line('│  ├─ ID: ' . $q->id . ', Module: ' . $q->module_id);
                $this->line('│  │  URL: ' . $q->image_url);
                
                $urlPath = str_replace('/storage/', '', $q->image_url);
                $exists = @Storage::disk('public')->exists($urlPath);
                $this->line('│  │  File Exists: ' . ($exists ? 'YES ✓' : 'NO ✗'));
            }
        }

        // 5. Check Database Training Materials
        $this->newLine();
        $this->info('5. DATABASE - TRAINING MATERIALS (Module 11)');
        $materials = DB::table('training_materials')
            ->where('module_id', 11)
            ->get(['id', 'module_id', 'title', 'file_path', 'file_type']);

        $this->line('├─ Materials for Module 11: ' . count($materials));
        if (count($materials) > 0) {
            $this->line('├─ Details:');
            foreach ($materials as $m) {
                $this->line('│  ├─ ID: ' . $m->id . ', Title: ' . $m->title);
                $this->line('│  │  Type: ' . $m->file_type . ', File Path: ' . $m->file_path);
                
                if ($m->file_path) {
                    $exists = @Storage::disk('public')->exists($m->file_path);
                    $this->line('│  │  File Exists: ' . ($exists ? 'YES ✓' : 'NO ✗'));
                }
            }
        }

        $this->newLine();
        $this->info('=== END OF REPORT ===');
    }
}
