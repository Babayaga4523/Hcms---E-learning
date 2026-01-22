<?php

require_once 'vendor/autoload.php';

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "Testing image upload in AdminTrainingProgramController\n\n";

// Check if admin exists
$admin = User::where('role', 'admin')->first();
if (!$admin) {
    echo "Creating admin user...\n";
    $admin = User::factory()->create(['role' => 'admin']);
}

echo "Admin ID: {$admin->id}\n";

// Simulate login
Auth::login($admin);

// Create a test request
$payload = [
    'title' => 'Test Program with Image ' . time(),
    'description' => 'Testing image upload functionality',
    'duration_minutes' => 60,
    'passing_grade' => 70,
    'category' => 'Core Business & Product',
    'is_active' => true,
    'pre_test_questions' => [
        [
            'question_text' => 'Test question with image',
            'option_a' => 'A',
            'option_b' => 'B',
            'option_c' => 'C',
            'option_d' => 'D',
            'correct_answer' => 'a',
            'explanation' => 'Test explanation'
        ]
    ]
];

echo "Test payload created without image\n";

// Test the controller method
try {
    $controller = new \App\Http\Controllers\AdminTrainingProgramController();
    $request = new Request($payload);
    $request->setUserResolver(function () use ($admin) {
        return $admin;
    });

    $response = $controller->store($request);

    echo "Response status: " . $response->getStatusCode() . "\n";
    echo "Response content: " . $response->getContent() . "\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}

echo "\nTest completed.\n";