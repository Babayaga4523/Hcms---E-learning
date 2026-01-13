<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Module;
use App\Models\TrainingMaterial;
use App\Models\Quiz;
use App\Models\Question;
use App\Models\User;

$title = 'Sample Program - Auto ' . date('YmdHis');

// Check if sample already exists (very unlikely due to timestamp)
if (Module::where('title', $title)->exists()) {
    echo "A module with title '{$title}' already exists. Aborting.\n";
    exit(1);
}

// Pick an instructor or admin user
$instructor = User::where('role', 'admin')->first() ?? User::first();
if (!$instructor) {
    echo "No user found to set as instructor. Please create a user first.\n";
    exit(1);
}

$module = Module::create([
    'title' => $title,
    'description' => 'This is an automated sample program with materials and pre/post tests created by script.',
    'is_active' => true,
    'has_pretest' => true,
    'has_posttest' => true,
    'approval_status' => 'approved',
    'approved_at' => now(),
    'approved_by' => $instructor->id,
    'instructor_id' => $instructor->id,
    'duration_minutes' => 120,
    'category' => 'sample',
    'difficulty' => 'beginner',
]);

echo "Created Module: {$module->id} - {$module->title}\n";

// Create 3 sample training materials
$materials = [
    ['title' => 'Intro Video', 'description' => 'Overview video', 'file_type' => 'video', 'file_path' => '/materials/sample/intro.mp4', 'file_name' => 'intro.mp4', 'file_size' => 0, 'duration_minutes' => 10],
    ['title' => 'Participant Guide', 'description' => 'PDF guide', 'file_type' => 'document', 'file_path' => '/materials/sample/guide.pdf', 'file_name' => 'guide.pdf', 'file_size' => 0],
    ['title' => 'Slide Deck', 'description' => 'Presentation slides', 'file_type' => 'ppt', 'file_path' => '/materials/sample/slides.pptx', 'file_name' => 'slides.pptx', 'file_size' => 0],
];

foreach ($materials as $i => $m) {
    $m['module_id'] = $module->id;
    $m['uploaded_by'] = $instructor->id;
    $m['order'] = $i;
    $mat = TrainingMaterial::create($m);
    echo "  - Material: {$mat->id} - {$mat->title}\n";
}

// Create pretest quiz
$pretest = Quiz::create([
    'module_id' => $module->id,
    'name' => 'Pretest - ' . $module->title,
    'type' => 'pretest',
    'description' => 'Pretest to gauge initial knowledge',
    'time_limit' => 15,
    'passing_score' => 60,
    'question_count' => 5,
    'is_active' => true,
]);

echo "Created Pretest Quiz: {$pretest->id}\n";

// Create posttest quiz
$posttest = Quiz::create([
    'module_id' => $module->id,
    'name' => 'Posttest - ' . $module->title,
    'type' => 'posttest',
    'description' => 'Posttest to measure learning',
    'time_limit' => 20,
    'passing_score' => 70,
    'question_count' => 5,
    'is_active' => true,
]);

echo "Created Posttest Quiz: {$posttest->id}\n";

// Helper to create questions
function create_mcq($moduleId, $questionText, $options, $type = 'pretest') {
    return Question::create([
        'module_id' => $moduleId,
        'question_text' => $questionText,
        'options' => $options,
        'question_type' => $type,
        'difficulty' => 'easy',
        'points' => 10,
        'correct_answer' => 'a',
    ]);
}

$preQuestions = [
    ['Apa tujuan pelatihan ini?', ['a'=>'Meningkatkan keterampilan','b'=>'Menghabiskan waktu','c'=>'Hanya untuk sertifikat','d'=>'Tidak jelas']],
    ['Berapa durasi pelatihan?', ['a'=>'30 menit','b'=>'60 menit','c'=>'90 menit','d'=>'120 menit']],
    ['Siapa target peserta?', ['a'=>'Manajer','b'=>'Staff','c'=>'Semua karyawan','d'=>'Eksternal']],
    ['Apa format pelatihan?', ['a'=>'Online','b'=>'Offline','c'=>'Hybrid','d'=>'Tidak ada']],
    ['Apa yang diharapkan setelah pelatihan?', ['a'=>'Peningkatan kinerja','b'=>'Hiburan','c'=>'Evaluasi saja','d'=>'Tidak ada perubahan']],
];

foreach ($preQuestions as $q) {
    $qq = create_mcq($module->id, $q[0], $q[1], 'pretest');
    echo "  - Pre Q: {$qq->id} - " . substr($qq->question_text,0,60) . "\n";
}

$postQuestions = [
    ['Apakah tujuan pelatihan tercapai?', ['a'=>'Ya sepenuhnya','b'=>'Sebagian','c'=>'Tidak','d'=>'Tidak relevan']],
    ['Seberapa berguna materi?', ['a'=>'Sangat berguna','b'=>'Cukup','c'=>'Kurang','d'=>'Tidak sama sekali']],
    ['Apakah Anda akan menerapkan pengetahuan?', ['a'=>'Ya','b'=>'Mungkin','c'=>'Tidak','d'=>'Belum tahu']],
    ['Apakah materi mudah dipahami?', ['a'=>'Sangat mudah','b'=>'Cukup','c'=>'Sulit','d'=>'Sangat sulit']],
    ['Apakah Anda merekomendasikan pelatihan?', ['a'=>'Ya','b'=>'Tidak','c'=>'Mungkin','d'=>'Tidak tahu']],
];

foreach ($postQuestions as $q) {
    $qq = create_mcq($module->id, $q[0], $q[1], 'posttest');
    echo "  - Post Q: {$qq->id} - " . substr($qq->question_text,0,60) . "\n";
}

// Update quizzes question_count to actual
$pretest->update(['question_count' => 5]);
$posttest->update(['question_count' => 5]);

echo "\nSample program created successfully. Module ID: {$module->id}\n";
