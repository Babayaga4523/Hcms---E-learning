<?php
require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

$material = \App\Models\TrainingMaterial::find(37);
$fp = $material->file_path ?: $material->pdf_path;
if (!$fp) {
    echo "No file path set\n";
    exit(0);
}

echo "Material ID: {$material->id}\n";
echo "DB file_path: {$material->file_path}\n";
echo "DB pdf_path: {$material->pdf_path}\n";
echo "Computed file path: {$fp}\n";

// Check Storage::exists
$exists = Storage::exists($fp) ? 'yes' : 'no';
echo "Storage::exists: {$exists}\n";

// Check on public disk
$existsPublic = Storage::disk('public')->exists(str_replace('public/', '', $fp)) ? 'yes' : 'no';
echo "Storage::disk('public')->exists: {$existsPublic}\n";

// Check raw filesystem
$fullPath = storage_path('app/' . $fp);
echo "storage_path: {$fullPath}\n";
echo "file_exists: " . (file_exists($fullPath) ? 'yes' : 'no') . "\n";

// Print root paths
echo "storage app dir: " . realpath(storage_path('app')) . "\n";

?>