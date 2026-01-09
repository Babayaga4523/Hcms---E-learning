<?php

use Illuminate\Support\Facades\DB;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

try {
    DB::beginTransaction();

    // Create Pretest Quiz for Module 44 (kskksksks)
    $pretestId = DB::table('quizzes')->insertGetId([
        'module_id' => 44,
        'name' => 'Pretest - kskksksks',
        'title' => 'Pretest kskksksks',
        'type' => 'pretest',
        'description' => 'Tes awal untuk mengukur pemahaman dasar tentang kskksksks',
        'passing_score' => 60,
        'time_limit' => 15,
        'show_answers' => true,
        'is_active' => true,
        'difficulty' => 'medium',
        'question_count' => 5,
        'status' => 'published',
        'quality_score' => 85,
        'coverage_score' => 80,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    echo "✓ Pretest quiz created (ID: $pretestId)\n";

    // Create 5 pretest questions
    $pretestQuestions = [
        [
            'module_id' => 44,
            'quiz_id' => $pretestId,
            'question_text' => 'Apa yang dimaksud dengan konsep dasar kskksksks?',
            'question_type' => 'pretest',
            'options' => json_encode([
                ['label' => 'a', 'text' => 'Konsep fundamental yang sangat penting'],
                ['label' => 'b', 'text' => 'Istilah teknis dalam programming'],
                ['label' => 'c', 'text' => 'Metode statistik lanjutan'],
                ['label' => 'd', 'text' => 'Protokol jaringan komputer']
            ]),
            'correct_answer' => 'a',
            'explanation' => 'Konsep dasar kskksksks merupakan konsep fundamental yang sangat penting dalam bidang ini.',
            'points' => 20,
            'order' => 1,
        ],
        [
            'module_id' => 44,
            'quiz_id' => $pretestId,
            'question_text' => 'Manakah dari berikut ini yang merupakan karakteristik utama kskksksks?',
            'question_type' => 'pretest',
            'options' => json_encode([
                ['label' => 'a', 'text' => 'Kompleksitas tinggi'],
                ['label' => 'b', 'text' => 'Kesederhanaan dan efisiensi'],
                ['label' => 'c', 'text' => 'Biaya operasional mahal'],
                ['label' => 'd', 'text' => 'Waktu implementasi lama']
            ]),
            'correct_answer' => 'b',
            'explanation' => 'Karakteristik utama kskksksks adalah kesederhanaan dan efisiensi dalam implementasinya.',
            'points' => 20,
            'order' => 2,
        ],
        [
            'module_id' => 44,
            'quiz_id' => $pretestId,
            'question_text' => 'Dalam konteks kskksksks, apa fungsi utama dari komponen X?',
            'question_type' => 'pretest',
            'options' => json_encode([
                ['label' => 'a', 'text' => 'Menyimpan data sementara'],
                ['label' => 'b', 'text' => 'Mengkoordinasikan proses utama'],
                ['label' => 'c', 'text' => 'Menampilkan interface pengguna'],
                ['label' => 'd', 'text' => 'Mengatur koneksi jaringan']
            ]),
            'correct_answer' => 'b',
            'explanation' => 'Komponen X dalam kskksksks berfungsi untuk mengkoordinasikan proses utama sistem.',
            'points' => 20,
            'order' => 3,
        ],
        [
            'module_id' => 44,
            'quiz_id' => $pretestId,
            'question_text' => 'Manakah pernyataan berikut yang benar tentang implementasi kskksksks?',
            'question_type' => 'pretest',
            'options' => json_encode([
                ['label' => 'a', 'text' => 'Hanya bisa diimplementasikan pada sistem besar'],
                ['label' => 'b', 'text' => 'Dapat diadaptasi untuk berbagai skala'],
                ['label' => 'c', 'text' => 'Memerlukan hardware khusus'],
                ['label' => 'd', 'text' => 'Tidak kompatibel dengan teknologi modern']
            ]),
            'correct_answer' => 'b',
            'explanation' => 'kskksksks dapat diadaptasi untuk berbagai skala implementasi, dari kecil hingga besar.',
            'points' => 20,
            'order' => 4,
        ],
        [
            'module_id' => 44,
            'quiz_id' => $pretestId,
            'question_text' => 'Apa manfaat utama menggunakan pendekatan kskksksks?',
            'question_type' => 'pretest',
            'options' => json_encode([
                ['label' => 'a', 'text' => 'Mengurangi kompleksitas sistem'],
                ['label' => 'b', 'text' => 'Meningkatkan biaya operasional'],
                ['label' => 'c', 'text' => 'Memersulit maintenance'],
                ['label' => 'd', 'text' => 'Mengurangi performa sistem']
            ]),
            'correct_answer' => 'a',
            'explanation' => 'Manfaat utama kskksksks adalah mengurangi kompleksitas sistem secara signifikan.',
            'points' => 20,
            'order' => 5,
        ],
    ];

    foreach ($pretestQuestions as $question) {
        DB::table('questions')->insert($question);
    }
    echo "✓ 5 pretest questions created\n";

    // Create Posttest Quiz for Module 44
    $posttestId = DB::table('quizzes')->insertGetId([
        'module_id' => 44,
        'name' => 'Posttest - kskksksks',
        'title' => 'Posttest kskksksks',
        'type' => 'posttest',
        'description' => 'Tes akhir untuk mengukur pemahaman setelah mengikuti training kskksksks',
        'passing_score' => 70,
        'time_limit' => 20,
        'show_answers' => true,
        'is_active' => true,
        'difficulty' => 'medium',
        'question_count' => 5,
        'status' => 'published',
        'quality_score' => 85,
        'coverage_score' => 80,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    echo "✓ Posttest quiz created (ID: $posttestId)\n";

    // Create 5 posttest questions
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
    echo "✓ 5 posttest questions created\n";

    DB::commit();
    echo "\n✅ Successfully created pretest and posttest quizzes with questions for module 'kskksksks' (ID: 44)\n";

} catch (Exception $e) {
    DB::rollBack();
    echo "❌ Error: " . $e->getMessage() . "\n";
}