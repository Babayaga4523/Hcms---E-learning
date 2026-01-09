<?php
require_once 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$m = \App\Models\TrainingMaterial::find(37);
$fp = $m->file_path ?: $m->pdf_path;

echo "Will test Storage checks for: {$fp}\n";
echo "Storage::exists: " . (\Illuminate\Support\Facades\Storage::exists($fp) ? 'yes' : 'no') . "\n";
if (strpos($fp, 'public/') === 0) {
    echo "Storage::disk('public')->exists: " . (\Illuminate\Support\Facades\Storage::disk('public')->exists(substr($fp,7)) ? 'yes' : 'no') . "\n";
    echo "Resolved path: " . \Illuminate\Support\Facades\Storage::disk('public')->path(substr($fp,7)) . "\n";
}

?>