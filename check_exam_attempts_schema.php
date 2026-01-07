<?php

use Illuminate\Support\Facades\DB;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Checking exam_attempts table structure ===\n\n";

$result = DB::select("SELECT sql FROM sqlite_master WHERE type='table' AND name='exam_attempts'");

if (!empty($result)) {
    echo "Table CREATE statement:\n";
    echo $result[0]->sql . "\n";
}
