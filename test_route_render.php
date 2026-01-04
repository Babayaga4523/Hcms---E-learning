<?php
// Test if the route works by simulating a request
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';

// Create a fake request to test the route
\Illuminate\Support\Facades\Route::group(['middleware' => 'web'], function () {
    require 'routes/web.php';
});

$routeCollection = app('router')->getRoutes();
$found = false;

foreach ($routeCollection as $route) {
    if (strpos($route->uri, 'question-management') !== false) {
        echo "✓ Route found: " . $route->uri . "\n";
        $found = true;
    }
}

if (!$found) {
    echo "✗ No question-management routes found\n";
} else {
    // Test loading a question
    $question = \App\Models\Question::find(31);
    if ($question) {
        echo "\n✓ Question loaded successfully\n";
        echo "Data to pass to Inertia:\n";
        $data = ['question' => $question->toArray()];
        echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }
}
