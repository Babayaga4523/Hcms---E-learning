<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use App\Models\User;
use App\Models\TrainingMaterial;

// Simulate user auth
$user = User::find(3); // Budi Santoso
Auth::setUser($user);

$trainingId = 71;
$materialId = 73;

echo "=== Testing File Serving ===\n";
$material = TrainingMaterial::find($materialId);
echo "Material: {$material->title}\n";
echo "File path from DB: {$material->file_path}\n\n";

// Test storage path resolution
echo "=== Storage Checks ===\n";
$filePath = $material->file_path;
echo "1. Storage::exists('{$filePath}'): " . (Storage::exists($filePath) ? 'YES' : 'NO') . "\n";
echo "2. Storage::disk('public')->exists('{$filePath}'): " . (Storage::disk('public')->exists($filePath) ? 'YES' : 'NO') . "\n";

if (Storage::exists($filePath)) {
    $fullPath = storage_path('app/' . $filePath);
    echo "3. Full path from Storage::path(): " . Storage::path($filePath) . "\n";
    echo "4. Full path from storage_path('app/' . ...): {$fullPath}\n";
    echo "5. file_exists on that path: " . (file_exists($fullPath) ? 'YES' : 'NO') . "\n";
}

// Try to call the serveFile method
echo "\n=== Calling serveFile ===\n";
try {
    $controller = new \App\Http\Controllers\User\MaterialController();
    $response = $controller->serveFile($trainingId, $materialId);
    
    // Check if it's a file response or error response
    if ($response instanceof \Symfony\Component\HttpFoundation\BinaryFileResponse) {
        echo "✓ serveFile returned a file response (BinaryFileResponse)\n";
        echo "Content-Type: " . $response->headers->get('Content-Type') . "\n";
        echo "File: " . $response->getFile()->getPathname() . "\n";
    } elseif (method_exists($response, 'getData')) {
        echo "✗ serveFile returned a JSON response:\n";
        echo json_encode($response->getData(), JSON_PRETTY_PRINT) . "\n";
    } else {
        echo "✓ serveFile returned response: " . get_class($response) . "\n";
    }
} catch (\Exception $e) {
    echo "✗ Exception: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
