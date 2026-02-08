<?php
require_once __DIR__ . '/bootstrap/app.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$request = Illuminate\Http\Request::capture();
$kernel->bootstrap();

// Query materials
$material18 = \App\Models\TrainingMaterial::find(18);
$material19 = \App\Models\TrainingMaterial::find(19);

echo "Material 18:\n";
echo json_encode($material18, JSON_PRETTY_PRINT) . "\n\n";

echo "Material 19:\n";
echo json_encode($material19, JSON_PRETTY_PRINT) . "\n\n";

// Check file existence
if ($material18) {
    $filePath = $material18->file_path ?: $material18->pdf_path;
    echo "Material 18 file_path: $filePath\n";
    
    // Check all possible locations
    echo "\nChecking file existence:\n";
    
    $paths = [
        'storage/app/public/' . $filePath => storage_path('app/public/' . $filePath),
        'storage/app/' . $filePath => storage_path('app/' . $filePath),
        $filePath => base_path() . '/' . $filePath,
    ];
    
    foreach ($paths as $desc => $fullPath) {
        $exists = file_exists($fullPath);
        echo "  $desc: " . ($exists ? "EXISTS" : "NOT FOUND") . "\n";
        if ($exists) {
            echo "    => Real path: $fullPath\n";
            echo "    => Size: " . filesize($fullPath) . " bytes\n";
        }
    }
}

if ($material19) {
    $filePath = $material19->file_path ?: $material19->pdf_path;
    echo "\n\nMaterial 19 file_path: $filePath\n";
    
    // Check all possible locations
    echo "\nChecking file existence:\n";
    
    $paths = [
        'storage/app/public/' . $filePath => storage_path('app/public/' . $filePath),
        'storage/app/' . $filePath => storage_path('app/' . $filePath),
        $filePath => base_path() . '/' . $filePath,
    ];
    
    foreach ($paths as $desc => $fullPath) {
        $exists = file_exists($fullPath);
        echo "  $desc: " . ($exists ? "EXISTS" : "NOT FOUND") . "\n";
        if ($exists) {
            echo "    => Real path: $fullPath\n";
            echo "    => Size: " . filesize($fullPath) . " bytes\n";
        }
    }
}

// Check storage structure
echo "\n\nStorage Structure:\n";
$storageDir = storage_path('app/public/materials');
if (is_dir($storageDir)) {
    echo "Storage directory exists: $storageDir\n";
    echo "Contents:\n";
    $files = scandir($storageDir, SCANDIR_SORT_ASCENDING);
    foreach ($files as $file) {
        if ($file !== '.' && $file !== '..') {
            $path = $storageDir . DIRECTORY_SEPARATOR . $file;
            if (is_dir($path)) {
                echo "  [DIR] $file\n";
                $subfiles = scandir($path);
                $count = count($subfiles) - 2;
                echo "    Contains $count files\n";
            } else {
                echo "  [FILE] $file (" . filesize($path) . " bytes)\n";
            }
        }
    }
}
