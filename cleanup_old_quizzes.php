<?php

require_once 'vendor/autoload.php';

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;

// Load Laravel environment
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

try {
    DB::beginTransaction();

    // Delete old quizzes for module 44 (IDs 20 and 21)
    $deletedQuizzes = DB::table('quizzes')
        ->where('module_id', 44)
        ->whereIn('id', [20, 21])
        ->delete();

    echo "Deleted $deletedQuizzes old quizzes\n";

    // Delete questions associated with old quizzes
    $deletedQuestions = DB::table('questions')
        ->where('module_id', 44)
        ->whereIn('quiz_id', [20, 21])
        ->delete();

    echo "Deleted $deletedQuestions questions from old quizzes\n";

    DB::commit();
    echo "✅ Cleanup completed successfully\n";

} catch (Exception $e) {
    DB::rollBack();
    echo "❌ Error: " . $e->getMessage() . "\n";
}