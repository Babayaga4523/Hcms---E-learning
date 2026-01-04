<?php
require 'vendor/autoload.php';

// Set up the application
$app = require __DIR__.'/bootstrap/app.php';

// Bind console to the app
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

// Test loading the route and rendering
try {
    $question = \App\Models\Question::find(35);
    
    if (!$question) {
        die("Question not found");
    }
    
    echo "✓ Question loaded successfully\n";
    echo "✓ Question ID: " . $question->id . "\n";
    
    // Test Inertia response
    $response = \Inertia\Inertia::render('Admin/QuestionManagement', [
        'question' => $question->toArray()
    ]);
    
    echo "✓ Inertia render successful\n";
    echo "✓ Response type: " . get_class($response) . "\n";
    
} catch (\Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
    echo "\nStack trace:\n";
    echo $e->getTraceAsString();
}
