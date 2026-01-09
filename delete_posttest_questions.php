<?php

require_once 'vendor/autoload.php';

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;

// Load Laravel environment
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

try {
    // Delete posttest questions for module 44
    $deleted = DB::table('questions')
        ->where('module_id', 44)
        ->where('question_type', 'posttest')
        ->delete();

    echo "Deleted $deleted posttest questions for module 44\n";

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}