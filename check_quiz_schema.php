<?php

use Illuminate\Support\Facades\DB;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Checking Quizzes Table Foreign Keys ===\n";
$foreignKeys = DB::select("SELECT sql FROM sqlite_master WHERE type='table' AND name='quizzes'");
print_r($foreignKeys);
