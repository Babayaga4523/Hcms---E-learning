<?php
require_once 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$m = \App\Models\TrainingMaterial::find(41);
$fp = $m->file_path ?: $m->pdf_path;
$basename = basename($fp);
$candidates = [
    storage_path('app/public/training-materials/' . $basename),
    storage_path('app/private/public/materials/' . $basename),
    storage_path('app/materials/' . $basename),
];
foreach ($candidates as $c) {
    echo $c . ' => ' . (file_exists($c) ? 'exists' : 'missing') . PHP_EOL;
}
?>