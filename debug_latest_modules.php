<?php

require_once 'vendor/autoload.php';

use Illuminate\Http\Request;
use App\Models\Module;

$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

try {
    echo "Total modules: " . Module::count() . PHP_EOL;
    $modules = Module::orderBy('created_at', 'desc')->take(3)->get();
    foreach ($modules as $m) {
        echo $m->id . ': ' . $m->title . ' - Active: ' . ($m->is_active ? 'Yes' : 'No') . PHP_EOL;
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . PHP_EOL;
}