<?php

require __DIR__ . '/../vendor/autoload.php';

use Illuminate\Support\Facades\DB;

$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make('Illuminate\\Contracts\\Console\\Kernel')->bootstrap();

$moduleMaterialsFromModules = DB::table('training_materials')
    ->where(function ($q) {
        $q->where('title', 'like', '% - Video')
          ->orWhere('title', 'like', '% - Document')
          ->orWhere('title', 'like', '% - Presentation');
    })->count();

$questionsWithOptions = DB::table('questions')->whereNotNull('options')->count();

// Sample rows
$sampleMaterials = DB::table('training_materials')->select('id','module_id','title','file_type','file_path')->limit(5)->get();
$sampleQuestions = DB::table('questions')->select('id','module_id','question_text','options')->whereNotNull('options')->limit(5)->get();

echo "Training materials that appear to be migrated from modules: $moduleMaterialsFromModules\n";
echo "Questions with JSON options: $questionsWithOptions\n\n";

echo "Sample training_materials rows:\n";
foreach($sampleMaterials as $m) {
    echo "- [$m->id] module:$m->module_id type:$m->file_type path:$m->file_path title:" . substr($m->title,0,60) . "\n";
}

echo "\nSample questions with options (JSON):\n";
foreach($sampleQuestions as $q) {
    echo "- [$q->id] module:$q->module_id text:" . substr($q->question_text,0,60) . " options:" . ($q->options ?: 'NULL') . "\n";
}

// Check user_material_progress table exists and show count
$hasUMP = DB::select("SHOW TABLES LIKE 'user_material_progress'");
if (count($hasUMP) > 0) {
    $umpCount = DB::table('user_material_progress')->count();
    echo "\nuser_material_progress rows: $umpCount\n";
} else {
    echo "\nuser_material_progress table not found.\n";
}
