<?php

require_once 'vendor/autoload.php';

use App\Models\Module;

$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "Checking test program creation...\n\n";

$module = Module::where('title', 'like', 'Test Program with Image%')->latest()->first();

if ($module) {
    echo 'Module found: ' . $module->id . ' - ' . $module->title . PHP_EOL;
    $questions = $module->questions;
    echo 'Questions count: ' . $questions->count() . PHP_EOL;

    foreach ($questions as $q) {
        echo 'Question: ' . $q->id . ' - image_url: ' . ($q->image_url ?? 'null') . PHP_EOL;
        if ($q->image_url) {
            $path = str_replace('/storage/', 'storage/app/public/', $q->image_url);
            echo 'File exists: ' . (file_exists($path) ? 'YES' : 'NO') . ' - Path: ' . $path . PHP_EOL;
        }
    }
} else {
    echo 'No test module found' . PHP_EOL;
}

echo "\nDone.\n";