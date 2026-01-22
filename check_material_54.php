<?php
require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/bootstrap/app.php';

use App\Models\TrainingMaterial;

$material = TrainingMaterial::find(54);
if ($material) {
    echo "Material 54 found:\n";
    echo "Title: " . $material->title . "\n";
    echo "Module ID: " . $material->module_id . "\n";
    echo "File Path: " . $material->file_path . "\n";
    echo "PDF Path: " . $material->pdf_path . "\n";
    echo "File Type: " . $material->file_type . "\n";
} else {
    echo "Material 54 not found\n";
}
