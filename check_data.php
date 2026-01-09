<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Check database connection and data
try {
    
    $users = \App\Models\User::where('role', 'user')->count();
    echo "✓ Total users: " . $users . "\n";
    
    $modules = \App\Models\Module::count();
    echo "✓ Total modules: " . $modules . "\n";
    
    $enrollments = \App\Models\UserTraining::count();
    echo "✓ Total enrollments: " . $enrollments . "\n";
    
    $completed = \App\Models\UserTraining::where('status', 'completed')->count();
    echo "✓ Completed trainings: " . $completed . "\n";
    
    $exams = \App\Models\ExamAttempt::count();
    echo "✓ Total exam attempts: " . $exams . "\n";
    
    $certifications = \App\Models\UserTraining::where('is_certified', true)->count();
    echo "✓ Total certifications: " . $certifications . "\n";
    
    echo "\n";
    
    if ($users == 0) {
        echo "⚠ WARNING: Tidak ada user data. Jalankan seeder untuk populate data.\n";
        echo "   Command: php artisan db:seed\n";
    } else {
        echo "✅ Data siap untuk dashboard!\n";
    }
    
} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
