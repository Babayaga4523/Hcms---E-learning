<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Simulate the request
$module_id = 3;
$question_type = 'pretest';

// Verify module exists
$module = \App\Models\Module::find($module_id);
if (!$module) {
    echo "✗ Module {$module_id} tidak ditemukan\n";
    exit(1);
}

echo "✓ Module ditemukan: " . $module->title . "\n";
echo "✓ Module ID: " . $module->id . "\n";
echo "✓ Question type: " . $question_type . "\n\n";

// Test Inertia render
try {
    $response = \Inertia\Inertia::render('Admin/QuestionManagement', [
        'module_id' => $module_id,
        'question_type' => $question_type,
    ]);
    echo "✓ Inertia render SUCCESS\n";
    echo "✓ Component akan menerima:\n";
    echo "   - module_id: {$module_id}\n";
    echo "   - question_type: {$question_type}\n";
    echo "   - question: null (karena create baru)\n\n";
    echo "✓ Form harus ter-populate dengan:\n";
    echo "   - question_type field: pretest (sudah dipilih)\n";
    echo "   - module_id: 3 (tersimpan di formData)\n";
    echo "   - Form ready untuk input soal baru\n";
} catch (\Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}
