<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Certificate;
use App\Models\UserTraining;
use Illuminate\Support\Facades\DB;

echo "=== Creating Certificate for Budi (Module 5) ===\n\n";

// Get Budi's enrollment
$enrollment = UserTraining::where('user_id', 3)->where('module_id', 5)->first();

if (!$enrollment) {
    echo "No enrollment found for Budi in Module 5!\n";
    exit(1);
}

echo "Enrollment found:\n";
echo "  - Status: {$enrollment->status}\n";
echo "  - Certificate ID: " . ($enrollment->certificate_id ?? 'NULL') . "\n\n";

// Create certificate
echo "Creating certificate...\n";
$certificate = Certificate::createForUser(3, 5);

if ($certificate) {
    echo "\n✓ Certificate created successfully!\n\n";
    echo "Certificate Details:\n";
    echo "  - ID: {$certificate->id}\n";
    echo "  - Number: {$certificate->certificate_number}\n";
    echo "  - User: {$certificate->user_name}\n";
    echo "  - Training: {$certificate->training_title}\n";
    echo "  - Score: {$certificate->score}\n";
    echo "  - Materials: {$certificate->materials_completed}\n";
    echo "  - Hours: {$certificate->hours}\n";
    echo "  - Instructor: {$certificate->instructor_name}\n";
    echo "  - Issued: {$certificate->issued_at}\n";
} else {
    echo "Failed to create certificate!\n";
}

echo "\n=== Done ===\n";
