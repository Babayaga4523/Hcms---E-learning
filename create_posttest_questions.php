<?php

require_once 'vendor/autoload.php';

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;

// Load Laravel environment
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

try {
    DB::beginTransaction();

    // Get the posttest quiz ID for module 44
    $posttestQuiz = DB::table('quizzes')
        ->where('module_id', 44)
        ->where('type', 'posttest')
        ->first();

    if (!$posttestQuiz) {
        throw new Exception("Posttest quiz not found for module 44");
    }

    $posttestId = $posttestQuiz->id;

    // Create 5 posttest questions with correct format
    $posttestQuestions = [
        [
            'module_id' => 44,
            'quiz_id' => $posttestId,
            'question_text' => 'Setelah mempelajari kskksksks, manakah yang merupakan best practice dalam implementasinya?',
            'question_type' => 'posttest',
            'options' => json_encode([
                ['label' => 'a', 'text' => 'Mengabaikan dokumentasi'],
                ['label' => 'b', 'text' => 'Melakukan testing menyeluruh'],
                ['label' => 'c', 'text' => 'Melewati tahap planning'],
                ['label' => 'd', 'text' => 'Menggunakan pendekatan trial and error']
            ]),
            'correct_answer' => 'b',
            'explanation' => 'Best practice dalam implementasi kskksksks adalah melakukan testing menyeluruh untuk memastikan kualitas.',
            'points' => 20,
            'order' => 1,
        ],
        [
            'module_id' => 44,
            'quiz_id' => $posttestId,
            'question_text' => 'Dalam troubleshooting kskksksks, langkah pertama yang harus dilakukan adalah?',
            'question_type' => 'posttest',
            'options' => json_encode([
                ['label' => 'a', 'text' => 'Mengganti seluruh sistem'],
                ['label' => 'b', 'text' => 'Mengidentifikasi gejala masalah'],
                ['label' => 'c', 'text' => 'Menyalahkan user'],
                ['label' => 'd', 'text' => 'Mengabaikan error log']
            ]),
            'correct_answer' => 'b',
            'explanation' => 'Langkah pertama dalam troubleshooting adalah mengidentifikasi gejala masalah secara sistematis.',
            'points' => 20,
            'order' => 2,
        ],
        [
            'module_id' => 44,
            'quiz_id' => $posttestId,
            'question_text' => 'Manakah dari berikut ini yang merupakan keunggulan utama kskksksks dibandingkan pendekatan tradisional?',
            'question_type' => 'posttest',
            'options' => json_encode([
                ['label' => 'a', 'text' => 'Lebih mahal dalam implementasi'],
                ['label' => 'b', 'text' => 'Lebih efisien dalam penggunaan resources'],
                ['label' => 'c', 'text' => 'Lebih kompleks dalam maintenance'],
                ['label' => 'd', 'text' => 'Kurang fleksibel']
            ]),
            'correct_answer' => 'b',
            'explanation' => 'Keunggulan utama kskksksks adalah efisiensi dalam penggunaan resources dibanding pendekatan tradisional.',
            'points' => 20,
            'order' => 3,
        ],
        [
            'module_id' => 44,
            'quiz_id' => $posttestId,
            'question_text' => 'Dalam konteks skalabilitas, kskksksks dapat dikategorikan sebagai?',
            'question_type' => 'posttest',
            'options' => json_encode([
                ['label' => 'a', 'text' => 'Sistem yang sulit diskalakan'],
                ['label' => 'b', 'text' => 'Sistem yang highly scalable'],
                ['label' => 'c', 'text' => 'Sistem yang statis'],
                ['label' => 'd', 'text' => 'Sistem yang terbatas kapasitasnya']
            ]),
            'correct_answer' => 'b',
            'explanation' => 'kskksksks merupakan sistem yang highly scalable dan dapat menangani pertumbuhan dengan baik.',
            'points' => 20,
            'order' => 4,
        ],
        [
            'module_id' => 44,
            'quiz_id' => $posttestId,
            'question_text' => 'Manakah yang merupakan indikator keberhasilan implementasi kskksksks?',
            'question_type' => 'posttest',
            'options' => json_encode([
                ['label' => 'a', 'text' => 'Penurunan performa sistem'],
                ['label' => 'b', 'text' => 'Peningkatan kepuasan user'],
                ['label' => 'c', 'text' => 'Bertambahnya kompleksitas'],
                ['label' => 'd', 'text' => 'Penurunan produktivitas']
            ]),
            'correct_answer' => 'b',
            'explanation' => 'Indikator keberhasilan implementasi kskksksks adalah peningkatan kepuasan user dan efisiensi sistem.',
            'points' => 20,
            'order' => 5,
        ],
    ];

    foreach ($posttestQuestions as $question) {
        DB::table('questions')->insert($question);
    }

    DB::commit();
    echo "✓ 5 posttest questions created with correct format\n";

} catch (Exception $e) {
    DB::rollBack();
    echo "❌ Error: " . $e->getMessage() . "\n";
}