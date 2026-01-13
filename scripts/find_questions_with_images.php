<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Question;

$questions = Question::whereNotNull('image_url')->where('image_url','<>','')->limit(20)->get();
if ($questions->isEmpty()) {
    echo "No questions with image_url found.\n";
    exit(0);
}
foreach ($questions as $q) {
    echo "ID: {$q->id} - image_url: {$q->image_url}\n";
}
