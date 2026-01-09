<?php

require __DIR__ . '/../vendor/autoload.php';

use Illuminate\Support\Facades\DB;

$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make('Illuminate\\Contracts\\Console\\Kernel')->bootstrap();

$modules = DB::table('modules')->select('id','video_url','document_url','presentation_url','title')->get();
$created = 0;
foreach ($modules as $m) {
    $now = date('Y-m-d H:i:s');

    if (!empty($m->video_url)) {
        $path = $m->video_url;
        DB::table('training_materials')->insert([
            'module_id' => $m->id,
            'title' => $m->title . ' - Video',
            'file_type' => 'video',
            'file_path' => $path,
            'file_name' => basename($path),
            'file_size' => 0,
            'uploaded_by' => 1,
            'created_at' => $now,
            'updated_at' => $now
        ]);
        $created++;
    }

    if (!empty($m->document_url)) {
        $path = $m->document_url;
        DB::table('training_materials')->insert([
            'module_id' => $m->id,
            'title' => $m->title . ' - Document',
            'file_type' => 'document',
            'file_path' => $path,
            'file_name' => basename($path),
            'file_size' => 0,
            'uploaded_by' => 1,
            'created_at' => $now,
            'updated_at' => $now
        ]);
        $created++;
    }

    if (!empty($m->presentation_url)) {
        $path = $m->presentation_url;
        DB::table('training_materials')->insert([
            'module_id' => $m->id,
            'title' => $m->title . ' - Presentation',
            'file_type' => 'presentation',
            'file_path' => $path,
            'file_name' => basename($path),
            'file_size' => 0,
            'uploaded_by' => 1,
            'created_at' => $now,
            'updated_at' => $now
        ]);
        $created++;
    }
}

echo "Migration complete. Created $created training_materials entries.\n";
