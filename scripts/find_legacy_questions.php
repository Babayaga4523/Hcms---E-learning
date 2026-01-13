<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Question;

$questions = Question::whereNull('options')->get();

if ($questions->isEmpty()) {
    echo "No questions found with null 'options' field.\n";
    exit(0);
}

echo "Found {$questions->count()} question(s) with null 'options' field:\n";
foreach ($questions as $q) {
    echo "ID: {$q->id} - " . substr($q->question_text, 0, 80) . "\n";
    echo "  option_a: " . ($q->option_a ?? '(null)') . "\n";
    echo "  option_b: " . ($q->option_b ?? '(null)') . "\n";
    echo "  option_c: " . ($q->option_c ?? '(null)') . "\n";
    echo "  option_d: " . ($q->option_d ?? '(null)') . "\n";
}
