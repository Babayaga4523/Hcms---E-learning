<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "=== Certificate Data Check ===\n\n";

// Check if certificates table exists
if (Schema::hasTable('certificates')) {
    $certs = DB::table('certificates')->get();
    echo "Certificates in DB: " . $certs->count() . "\n";
    foreach ($certs as $c) {
        echo "  - ID: {$c->id} | User: {$c->user_id} | Module: {$c->module_id}\n";
    }
} else {
    echo "Certificates table does not exist!\n";
}

echo "\n--- User Training Enrollments ---\n";
$enrollments = DB::table('user_trainings')->where('user_id', 3)->get();
echo "Enrollments for Budi (ID: 3): " . $enrollments->count() . "\n";
foreach ($enrollments as $e) {
    echo "  - Module: {$e->module_id} | Status: {$e->status} | Certificate ID: " . ($e->certificate_id ?? 'NULL') . "\n";
}

echo "\n--- Exam Attempts (Passed) ---\n";
$attempts = DB::table('exam_attempts')->where('user_id', 3)->where('is_passed', true)->get();
echo "Passed exams for Budi: " . $attempts->count() . "\n";
foreach ($attempts as $a) {
    echo "  - Module: {$a->module_id} | Type: {$a->exam_type} | Score: {$a->score}\n";
}

echo "\n=== Done ===\n";
