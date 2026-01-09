<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

try {
    $modules = \App\Models\Module::select('id', 'title')->get();
    echo "Available modules:\n";
    foreach ($modules as $module) {
        echo "ID: {$module->id}, Title: {$module->title}\n";
    }

    // Also check existing quizzes
    $quizzes = \App\Models\Quiz::select('id', 'module_id', 'type', 'title')->get();
    echo "\nExisting quizzes:\n";
    foreach ($quizzes as $quiz) {
        echo "ID: {$quiz->id}, Module: {$quiz->module_id}, Type: {$quiz->type}, Title: {$quiz->title}\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}