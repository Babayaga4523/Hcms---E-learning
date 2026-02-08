<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Services\StorageStructureService;

echo "=== STORAGE STRUCTURE VERIFICATION ===\n\n";

// Initialize
echo "📦 Initializing storage structure...\n";
$init = StorageStructureService::initialize();
if (!empty($init['created'])) {
    foreach ($init['created'] as $folder) {
        echo "   ✓ Created: $folder\n";
    }
}

// Verify
echo "\n✅ Verifying storage structure...\n";
$verify = StorageStructureService::verify();

echo "\nFolders:\n";
foreach ($verify['folders'] as $folder => $status) {
    $symbol = $status['exists'] ? '✓' : '✗';
    $writable = $status['writable'] ? '(writable)' : '(not writable)';
    echo "  $symbol $folder $writable\n";
}

echo "\nSymlink:\n";
echo "  " . ($verify['symlink']['exists'] ? '✓' : '✗') . " public/storage\n";

echo "\n" . str_repeat("=", 50) . "\n";
echo "Status: " . $verify['status'] . "\n";

if (!empty($verify['issues'])) {
    echo "\nIssues found:\n";
    foreach ($verify['issues'] as $issue) {
        echo "  ⚠️  $issue\n";
    }
}

echo "\n📌 Storage Structure Ready:\n";
echo "  Questions:  /storage/questions/\n";
echo "  Materials:  /storage/materials/\n";
echo "  Programs:   /storage/training-programs/\n";
