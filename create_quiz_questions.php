<?php

use Illuminate\Support\Facades\DB;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

try {
    // Disable foreign key checks for SQLite
    DB::statement('PRAGMA foreign_keys = OFF');
    
    DB::beginTransaction();

    // Create Pretest Quiz for Module 5 (Customer Service Excellence)
    $pretestId = DB::table('quizzes')->insertGetId([
        'module_id' => 5,
        'name' => 'Pretest - Customer Service Excellence',
        'title' => 'Pretest Customer Service Excellence',
        'type' => 'pretest',
        'description' => 'Tes awal untuk mengukur pemahaman dasar tentang customer service excellence',
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

    // Create Posttest Quiz for Module 5
    $posttestId = DB::table('quizzes')->insertGetId([
        'module_id' => 5,
        'name' => 'Posttest - Customer Service Excellence',
        'title' => 'Posttest Customer Service Excellence',
        'type' => 'posttest',
        'description' => 'Tes akhir untuk mengukur pemahaman setelah mengikuti training customer service excellence',
        'passing_score' => 70,
        'time_limit' => 20,
        'show_answers' => true,
        'is_active' => true,
        'difficulty' => 'medium',
        'question_count' => 5,
        'status' => 'published',
        'quality_score' => 90,
        'coverage_score' => 85,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    echo "✓ Posttest quiz created (ID: $posttestId)\n\n";

    // Pretest Questions
    $pretestQuestions = [
        [
            'module_id' => 5,
            'question_text' => 'Apa yang dimaksud dengan Customer Service Excellence?',
            'question_type' => 'multiple_choice',
            'option_a' => 'Memberikan layanan dengan cepat tanpa memperhatikan kualitas',
            'option_b' => 'Memberikan layanan yang melampaui ekspektasi pelanggan dengan konsisten',
            'option_c' => 'Hanya fokus pada penjualan produk',
            'option_d' => 'Mengikuti prosedur standar tanpa fleksibilitas',
            'correct_answer' => 'B',
            'difficulty' => 'easy',
            'points' => 20,
            'created_at' => now(),
            'updated_at' => now(),
        ],
        [
            'module_id' => 5,
            'question_text' => 'Manakah yang BUKAN merupakan prinsip dasar customer service yang baik?',
            'question_type' => 'multiple_choice',
            'option_a' => 'Empati terhadap pelanggan',
            'option_b' => 'Responsif terhadap kebutuhan pelanggan',
            'option_c' => 'Mengabaikan komplain pelanggan',
            'option_d' => 'Komunikasi yang efektif',
            'correct_answer' => 'C',
            'difficulty' => 'easy',
            'points' => 20,
            'created_at' => now(),
            'updated_at' => now(),
        ],
        [
            'module_id' => 5,
            'question_text' => 'Apa yang harus dilakukan pertama kali saat menghadapi pelanggan yang marah?',
            'question_type' => 'multiple_choice',
            'option_a' => 'Membela diri dan menjelaskan kesalahan pelanggan',
            'option_b' => 'Mendengarkan dengan sabar dan berempati',
            'option_c' => 'Mengalihkan ke departemen lain',
            'option_d' => 'Mengabaikan sampai pelanggan tenang',
            'correct_answer' => 'B',
            'difficulty' => 'medium',
            'points' => 20,
            'created_at' => now(),
            'updated_at' => now(),
        ],
        [
            'module_id' => 5,
            'question_text' => 'Apa yang dimaksud dengan "active listening" dalam customer service?',
            'question_type' => 'multiple_choice',
            'option_a' => 'Mendengar sambil melakukan pekerjaan lain',
            'option_b' => 'Mendengarkan dengan penuh perhatian dan memberikan respons yang sesuai',
            'option_c' => 'Hanya menunggu giliran berbicara',
            'option_d' => 'Mendengar tanpa memberikan feedback',
            'correct_answer' => 'B',
            'difficulty' => 'medium',
            'points' => 20,
            'created_at' => now(),
            'updated_at' => now(),
        ],
        [
            'module_id' => 5,
            'question_text' => 'Mengapa follow-up penting dalam customer service?',
            'question_type' => 'multiple_choice',
            'option_a' => 'Untuk memastikan kepuasan pelanggan dan menunjukkan komitmen',
            'option_b' => 'Hanya untuk formalitas',
            'option_c' => 'Tidak penting jika masalah sudah selesai',
            'option_d' => 'Hanya dilakukan jika pelanggan meminta',
            'correct_answer' => 'A',
            'difficulty' => 'easy',
            'points' => 20,
            'created_at' => now(),
            'updated_at' => now(),
        ],
    ];

    foreach ($pretestQuestions as $index => $question) {
        DB::table('questions')->insert($question);
        echo "✓ Pretest question " . ($index + 1) . " created\n";
    }

    echo "\n";

    // Posttest Questions
    $posttestQuestions = [
        [
            'module_id' => 5,
            'question_text' => 'Dalam situasi high-pressure dengan banyak pelanggan menunggu, strategi mana yang paling efektif?',
            'question_type' => 'multiple_choice',
            'option_a' => 'Melayani secepat mungkin tanpa memperhatikan kualitas',
            'option_b' => 'Tetap tenang, prioritaskan berdasarkan urgensi, dan komunikasikan waktu tunggu',
            'option_c' => 'Fokus pada satu pelanggan dan abaikan yang lain',
            'option_d' => 'Meminta pelanggan untuk datang kembali lain waktu',
            'correct_answer' => 'B',
            'difficulty' => 'medium',
            'points' => 20,
            'created_at' => now(),
            'updated_at' => now(),
        ],
        [
            'module_id' => 5,
            'question_text' => 'Bagaimana cara terbaik menangani komplain pelanggan yang tidak dapat diselesaikan segera?',
            'question_type' => 'multiple_choice',
            'option_a' => 'Memberikan janji palsu agar pelanggan puas sementara',
            'option_b' => 'Menyalahkan sistem atau pihak lain',
            'option_c' => 'Komunikasikan transparansi, berikan timeline realistis, dan lakukan follow-up berkala',
            'option_d' => 'Meminta pelanggan untuk bersabar tanpa informasi lebih lanjut',
            'correct_answer' => 'C',
            'difficulty' => 'hard',
            'points' => 20,
            'created_at' => now(),
            'updated_at' => now(),
        ],
        [
            'module_id' => 5,
            'question_text' => 'Apa yang membedakan service recovery yang excellent dari yang standar?',
            'question_type' => 'multiple_choice',
            'option_a' => 'Hanya meminta maaf',
            'option_b' => 'Proaktif, personalisasi solusi, dan memberikan kompensasi yang sesuai',
            'option_c' => 'Mengikuti prosedur standar tanpa fleksibilitas',
            'option_d' => 'Menunggu pelanggan komplain berkali-kali',
            'correct_answer' => 'B',
            'difficulty' => 'hard',
            'points' => 20,
            'created_at' => now(),
            'updated_at' => now(),
        ],
        [
            'module_id' => 5,
            'question_text' => 'Dalam konteks customer service excellence, apa arti dari "moment of truth"?',
            'question_type' => 'multiple_choice',
            'option_a' => 'Waktu pelanggan membayar',
            'option_b' => 'Setiap interaksi yang membentuk persepsi pelanggan tentang perusahaan',
            'option_c' => 'Hanya saat pertama kali bertemu pelanggan',
            'option_d' => 'Saat memberikan diskon',
            'correct_answer' => 'B',
            'difficulty' => 'medium',
            'points' => 20,
            'created_at' => now(),
            'updated_at' => now(),
        ],
        [
            'module_id' => 5,
            'question_text' => 'Bagaimana cara mengukur keberhasilan customer service excellence?',
            'question_type' => 'multiple_choice',
            'option_a' => 'Hanya dari jumlah pelanggan yang dilayani',
            'option_b' => 'Customer satisfaction score, retention rate, NPS, dan feedback positif',
            'option_c' => 'Dari kecepatan penyelesaian masalah saja',
            'option_d' => 'Hanya dari tidak adanya komplain',
            'correct_answer' => 'B',
            'difficulty' => 'hard',
            'points' => 20,
            'created_at' => now(),
            'updated_at' => now(),
        ],
    ];

    foreach ($posttestQuestions as $index => $question) {
        DB::table('questions')->insert($question);
        echo "✓ Posttest question " . ($index + 1) . " created\n";
    }

    DB::commit();
    
    // Re-enable foreign key checks
    DB::statement('PRAGMA foreign_keys = ON');

    echo "\n✅ Successfully created 2 quizzes with 10 questions total!\n";
    echo "   - Pretest: 5 questions\n";
    echo "   - Posttest: 5 questions\n";
    echo "\nModule: Customer Service Excellence (ID: 5)\n";

} catch (\Exception $e) {
    DB::rollback();
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
