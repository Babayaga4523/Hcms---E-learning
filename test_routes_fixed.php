<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "✓ Routes yang akan diakses:\n\n";

echo "1. Edit soal (ID 35):\n";
echo "   URL: /admin/question-management/35\n";
echo "   Expected: QuestionManagement component dengan question data\n\n";

echo "2. Tambah soal pretest untuk program 3:\n";
echo "   URL: /admin/question-management?module=3&type=pretest\n";
echo "   Expected: QuestionManagement component dengan module_id=3, question_type=pretest\n\n";

echo "3. Tambah soal posttest untuk program 3:\n";
echo "   URL: /admin/question-management?module=3&type=posttest\n";
echo "   Expected: QuestionManagement component dengan module_id=3, question_type=posttest\n\n";

// Verify question exists
$question = \App\Models\Question::find(35);
if ($question) {
    echo "✓ Question 35 exists and ready to edit\n";
}

// Get a module to test
$module = \App\Models\Module::find(3);
if ($module) {
    echo "✓ Module 3 exists for testing add question\n";
}
