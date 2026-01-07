<?php

use Illuminate\Support\Facades\DB;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== All Quizzes ===\n";
$quizzes = DB::table('quizzes')->get();
echo "Total quizzes: " . $quizzes->count() . "\n\n";

if ($quizzes->count() > 0) {
    echo json_encode($quizzes->toArray(), JSON_PRETTY_PRINT);
    echo "\n\n";
}

echo "=== Quizzes for module/training 5 ===\n";
$quiz5 = DB::table('quizzes')
    ->where(function($query) {
        $query->where('module_id', 5)
              ->orWhere('training_program_id', 5);
    })
    ->get();
echo "Found: " . $quiz5->count() . " quizzes\n";

if ($quiz5->count() > 0) {
    echo json_encode($quiz5->toArray(), JSON_PRETTY_PRINT);
}

echo "\n=== All Modules ===\n";
$modules = DB::table('modules')->get(['id', 'title', 'description', 'status']);
echo json_encode($modules->toArray(), JSON_PRETTY_PRINT);
