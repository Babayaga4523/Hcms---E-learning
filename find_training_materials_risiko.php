<?php
require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\TrainingMaterial;

$items = TrainingMaterial::where('file_path', 'like', '%risiko%')->orWhere('pdf_path', 'like', '%risiko%')->get();
if ($items->isEmpty()) {
    echo "No TrainingMaterial records found containing 'risiko' in file_path or pdf_path\n";
    exit(0);
}

foreach ($items as $it) {
    echo "ID: {$it->id}\n";
    echo "Module ID: {$it->module_id}\n";
    echo "Title: {$it->title}\n";
    echo "file_path: {$it->file_path}\n";
    echo "pdf_path: {$it->pdf_path}\n";
    echo "----\n";
}
