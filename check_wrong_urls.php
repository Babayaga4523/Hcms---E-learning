<?php

require_once 'vendor/autoload.php';

use App\Models\Question;

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "Questions with images NOT starting with /storage/:\n";

$questions = Question::whereNotNull('image_url')
    ->where('image_url', '!=', '')
    ->where('image_url', 'NOT LIKE', '/storage/%')
    ->select('id', 'image_url')
    ->get();

foreach ($questions as $q) {
    echo "ID: {$q->id} - URL: {$q->image_url}\n";
}

echo "Total: " . $questions->count() . "\n";