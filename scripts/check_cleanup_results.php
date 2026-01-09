<?php

require __DIR__ . '/../vendor/autoload.php';

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make('Illuminate\\Contracts\\Console\\Kernel')->bootstrap();

$hasModulesMediaBackup = Schema::hasTable('modules_media_backup');
$modulesMediaCount = $hasModulesMediaBackup ? DB::table('modules_media_backup')->count() : 0;

$hasQuestionOptionsBackup = Schema::hasTable('question_options_backup');
$questionOptionsCount = $hasQuestionOptionsBackup ? DB::table('question_options_backup')->count() : 0;

$modulesCols = [
    'video_url' => Schema::hasColumn('modules', 'video_url'),
    'document_url' => Schema::hasColumn('modules', 'document_url'),
    'presentation_url' => Schema::hasColumn('modules', 'presentation_url'),
];

$questionCols = [
    'option_a' => Schema::hasColumn('questions', 'option_a'),
    'option_b' => Schema::hasColumn('questions', 'option_b'),
    'option_c' => Schema::hasColumn('questions', 'option_c'),
    'option_d' => Schema::hasColumn('questions', 'option_d'),
];

echo "modules_media_backup exists: " . ($hasModulesMediaBackup ? 'yes' : 'no') . " (rows: $modulesMediaCount)\n";
echo "question_options_backup exists: " . ($hasQuestionOptionsBackup ? 'yes' : 'no') . " (rows: $questionOptionsCount)\n\n";

foreach ($modulesCols as $col => $exists) {
    echo "modules.$col exists: " . ($exists ? 'yes' : 'no') . "\n";
}

echo "\n";

foreach ($questionCols as $col => $exists) {
    echo "questions.$col exists: " . ($exists ? 'yes' : 'no') . "\n";
}
