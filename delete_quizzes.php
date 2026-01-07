<?php

use Illuminate\Support\Facades\DB;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

try {
    DB::statement('PRAGMA foreign_keys = OFF');
    DB::table('quizzes')->delete();
    DB::statement('PRAGMA foreign_keys = ON');
    echo "✓ All quizzes deleted\n";
} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
