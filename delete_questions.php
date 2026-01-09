<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

try {
    $deleted = \App\Models\Question::where('module_id', 44)->delete();
    echo "Deleted $deleted questions for module 44\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}