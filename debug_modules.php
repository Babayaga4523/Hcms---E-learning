<?php

require_once 'vendor/autoload.php';

use Illuminate\Http\Request;
use App\Models\Module;

$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

try {
    $modules = Module::select('id', 'title', 'is_active')->get();
    echo "Modules found: " . $modules->count() . "\n";
    foreach ($modules as $module) {
        echo "ID: {$module->id}, Title: {$module->title}, Active: " . ($module->is_active ? 'Yes' : 'No') . "\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}