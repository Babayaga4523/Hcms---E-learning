<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

try {
    $quizCount = \App\Models\Quiz::count();
    echo "Total quizzes: $quizCount\n";

    if ($quizCount > 0) {
        $quizzes = \App\Models\Quiz::take(5)->get();
        foreach ($quizzes as $quiz) {
            echo "Quiz ID: {$quiz->id}, Module: {$quiz->module_id}, Type: {$quiz->type}, Title: {$quiz->title}\n";
        }
    }

    // Check modules
    $moduleCount = \App\Models\Module::count();
    echo "Total modules: $moduleCount\n";

    if ($moduleCount > 0) {
        $modules = \App\Models\Module::take(5)->get();
        foreach ($modules as $module) {
            echo "Module ID: {$module->id}, Title: {$module->title}\n";
        }
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}