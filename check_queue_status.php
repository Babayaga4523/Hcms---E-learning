<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== LARAVEL QUEUE STATUS ===\n";
echo "Queue Connection: " . config('queue.default') . "\n";
echo "Queue Config: " . json_encode(config('queue.connections.' . config('queue.default')), JSON_PRETTY_PRINT) . "\n\n";

// Check failed jobs
echo "=== FAILED JOBS ===\n";
$failedJobs = \DB::table('failed_jobs')->count();
echo "Total Failed Jobs: " . $failedJobs . "\n";

if ($failedJobs > 0) {
    $jobs = \DB::table('failed_jobs')
        ->orderBy('failed_at', 'desc')
        ->limit(5)
        ->get();
    
    echo "\nLast 5 Failed Jobs:\n";
    foreach ($jobs as $job) {
        echo "\nJob ID: " . $job->id . "\n";
        echo "  Payload: " . substr($job->payload, 0, 100) . "...\n";
        echo "  Failed at: " . $job->failed_at . "\n";
        echo "  Exception: " . substr($job->exception, 0, 150) . "...\n";
    }
}

// Check pending jobs
echo "\n=== PENDING JOBS ===\n";
$pendingJobs = \DB::table('jobs')->count();
echo "Total Pending Jobs: " . $pendingJobs . "\n";

if ($pendingJobs > 0) {
    $jobs = \DB::table('jobs')
        ->limit(5)
        ->get();
    
    echo "\nFirst 5 Pending Jobs:\n";
    foreach ($jobs as $job) {
        echo "Job ID: " . $job->id . " | Queue: " . $job->queue . " | Attempts: " . $job->attempts . "\n";
    }
}

// Check certificate generation for Budi
echo "\n=== BUDI'S CERTIFICATE DATA ===\n";
$user = \App\Models\User::where('email', 'budi.santoso@bni.co.id')->first();
if ($user) {
    $training = \App\Models\UserTraining::where('user_id', $user->id)->first();
    $cert = \App\Models\Certificate::where('user_id', $user->id)->first();
    
    echo "User: " . $user->name . " (ID: " . $user->id . ")\n";
    echo "Training Status: " . $training->status . "\n";
    echo "  is_certified: " . var_export($training->is_certified, true) . "\n";
    echo "  completed_at: " . $training->completed_at . "\n";
    echo "Certificate Exists: " . ($cert ? "YES (ID: " . $cert->id . ")" : "NO") . "\n";
}
