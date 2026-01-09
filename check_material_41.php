<?php
require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Storage;

$m = \App\Models\TrainingMaterial::find(41);
if (!$m) { echo "Material 41 not found\n"; exit; }
$fp = $m->file_path ?: $m->pdf_path;

echo "Material ID: {$m->id}\n";
echo "DB file_path: {$m->file_path}\n";
echo "DB pdf_path: {$m->pdf_path}\n";
echo "Computed file path: {$fp}\n";

echo "Storage::exists: " . (Storage::exists($fp) ? 'yes' : 'no') . "\n";
if (strpos($fp, 'public/') === 0) {
    $rel = substr($fp, 7);
    echo "Storage::disk('public')->exists: " . (Storage::disk('public')->exists($rel) ? 'yes' : 'no') . "\n";
    echo "Resolved path: " . Storage::disk('public')->path($rel) . "\n";
    echo "file_exists(storage_path('app/' . $fp)): " . (file_exists(storage_path('app/' . $fp)) ? 'yes' : 'no') . "\n";
}

$full = storage_path('app/' . $fp);
echo "storage_path: {$full}\n";
echo "file_exists: " . (file_exists($full) ? 'yes' : 'no') . "\n";
?>