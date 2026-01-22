<?php

require_once 'vendor/autoload.php';

use App\Models\Question;
use Illuminate\Support\Facades\DB;

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "Checking questions with images in database:\n\n";

$questions = Question::whereNotNull('image_url')
    ->where('image_url', '!=', '')
    ->select('id', 'question_text', 'image_url')
    ->limit(10)
    ->get();

foreach ($questions as $q) {
    echo "ID: {$q->id}\n";
    echo "Question: " . substr($q->question_text, 0, 50) . "...\n";
    echo "Image URL: {$q->image_url}\n";
    echo "---\n";
}

echo "\nTotal questions with images: " . $questions->count() . "\n";