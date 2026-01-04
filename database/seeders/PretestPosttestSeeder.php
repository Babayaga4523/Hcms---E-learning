<?php

namespace Database\Seeders;

use App\Models\Module;
use App\Models\Question;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PretestPosttestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $programs = Module::all();

        foreach ($programs as $program) {
            // Skip if already has questions
            if (Question::where('module_id', $program->id)->count() > 0) {
                continue;
            }

            $this->createPretestQuestions($program);
            $this->createPosttestQuestions($program);

            $this->command->info("Created pretest & posttest for: {$program->title}");
        }
    }

    private function createPretestQuestions(Module $program)
    {
        $pretestQuestions = [
            [
                'question_text' => 'Apa tujuan utama dari program pelatihan ini?',
                'option_a' => 'Meningkatkan keterampilan dan pengetahuan peserta',
                'option_b' => 'Hanya untuk mengisi waktu kosong',
                'option_c' => 'Memberikan sertifikat kepada semua peserta',
                'option_d' => 'Tidak memiliki tujuan khusus',
                'correct_answer' => 'a',
                'difficulty' => 'easy',
                'question_type' => 'pretest',
                'explanation' => 'Tujuan utama pelatihan adalah meningkatkan kompetensi dan pengetahuan peserta di bidang tertentu.',
                'module_id' => $program->id,
            ],
            [
                'question_text' => 'Apa yang Anda ketahui tentang materi yang akan dipelajari?',
                'option_a' => 'Sangat paham dengan materi',
                'option_b' => 'Cukup paham dengan materi',
                'option_c' => 'Kurang paham dengan materi',
                'option_d' => 'Sama sekali tidak paham',
                'correct_answer' => 'd',
                'difficulty' => 'easy',
                'question_type' => 'pretest',
                'explanation' => 'Pretest untuk mengukur tingkat pemahaman awal peserta sebelum mengikuti pelatihan.',
                'module_id' => $program->id,
            ],
            [
                'question_text' => 'Berapa lama durasi program pelatihan ini?',
                'option_a' => $program->duration_minutes . ' menit',
                'option_b' => ($program->duration_minutes + 30) . ' menit',
                'option_c' => ($program->duration_minutes - 30) . ' menit',
                'option_d' => '2 jam',
                'correct_answer' => 'a',
                'difficulty' => 'easy',
                'question_type' => 'pretest',
                'explanation' => "Durasi program pelatihan '{$program->title}' adalah {$program->duration_minutes} menit.",
                'module_id' => $program->id,
            ],
            [
                'question_text' => 'Berapa nilai minimum yang dibutuhkan untuk lulus program ini?',
                'option_a' => $program->passing_grade . '%',
                'option_b' => ($program->passing_grade - 10) . '%',
                'option_c' => ($program->passing_grade + 10) . '%',
                'option_d' => '100%',
                'correct_answer' => 'a',
                'difficulty' => 'easy',
                'question_type' => 'pretest',
                'explanation' => "Nilai minimum yang dibutuhkan untuk lulus adalah {$program->passing_grade}%.",
                'module_id' => $program->id,
            ],
            [
                'question_text' => 'Apa yang akan Anda lakukan jika menemui kesulitan dalam pelatihan?',
                'option_a' => 'Berhenti dan tidak melanjutkan',
                'option_b' => 'Mencari bantuan dari instruktur atau rekan',
                'option_c' => 'Mengabaikan dan lanjut',
                'option_d' => 'Keluar dari program',
                'correct_answer' => 'b',
                'difficulty' => 'medium',
                'question_type' => 'pretest',
                'explanation' => 'Dalam menghadapi kesulitan, peserta harus proaktif mencari bantuan dari instruktur atau rekan kerja.',
                'module_id' => $program->id,
            ],
        ];

        foreach ($pretestQuestions as $question) {
            Question::create($question);
        }
    }

    private function createPosttestQuestions(Module $program)
    {
        $posttestQuestions = [
            [
                'question_text' => 'Apa pembelajaran terpenting yang Anda dapatkan dari program ini?',
                'option_a' => 'Tidak ada pembelajaran sama sekali',
                'option_b' => 'Sedikit pembelajaran yang berguna',
                'option_c' => 'Pembelajaran yang sangat bermanfaat dan applicable',
                'option_d' => 'Pembelajaran yang membingungkan',
                'correct_answer' => 'c',
                'difficulty' => 'medium',
                'question_type' => 'posttest',
                'explanation' => 'Peserta diharapkan memperoleh pembelajaran yang bermanfaat dan dapat diterapkan dalam pekerjaan sehari-hari.',
                'module_id' => $program->id,
            ],
            [
                'question_text' => 'Apakah Anda merasa siap mengimplementasikan pengetahuan yang telah dipelajari?',
                'option_a' => 'Ya, sangat siap',
                'option_b' => 'Cukup siap',
                'option_c' => 'Kurang siap',
                'option_d' => 'Tidak siap sama sekali',
                'correct_answer' => 'a',
                'difficulty' => 'medium',
                'question_type' => 'posttest',
                'explanation' => 'Peserta diharapkan merasa siap untuk menerapkan pengetahuan yang telah dipelajari.',
                'module_id' => $program->id,
            ],
            [
                'question_text' => 'Bagaimana kualitas materi pelatihan secara keseluruhan?',
                'option_a' => 'Sangat baik dan komprehensif',
                'option_b' => 'Baik namun perlu perbaikan',
                'option_c' => 'Cukup namun kurang detail',
                'option_d' => 'Kurang memuaskan',
                'correct_answer' => 'a',
                'difficulty' => 'medium',
                'question_type' => 'posttest',
                'explanation' => 'Feedback positif menunjukkan bahwa materi pelatihan telah dirancang dengan baik.',
                'module_id' => $program->id,
            ],
            [
                'question_text' => 'Apakah Anda akan merekomendasikan program ini kepada orang lain?',
                'option_a' => 'Ya, sangat recommended',
                'option_b' => 'Ya, namun perlu perbaikan',
                'option_c' => 'Mungkin, jika ada perubahan',
                'option_d' => 'Tidak akan merekommasikan',
                'correct_answer' => 'a',
                'difficulty' => 'easy',
                'question_type' => 'posttest',
                'explanation' => 'Program yang baik akan mendapatkan rekomendasi positif dari peserta yang puas.',
                'module_id' => $program->id,
            ],
            [
                'question_text' => 'Apa saran Anda untuk meningkatkan program ini di masa depan?',
                'option_a' => 'Tingkatkan kualitas materi dan interaktivitas',
                'option_b' => 'Tambahkan lebih banyak studi kasus praktis',
                'option_c' => 'Sediakan lebih banyak waktu untuk diskusi',
                'option_d' => 'Semua pilihan di atas relevan',
                'correct_answer' => 'd',
                'difficulty' => 'medium',
                'question_type' => 'posttest',
                'explanation' => 'Semua masukan dari peserta sangat berharga untuk perbaikan program di masa depan.',
                'module_id' => $program->id,
            ],
        ];

        foreach ($posttestQuestions as $question) {
            Question::create($question);
        }
    }
}
