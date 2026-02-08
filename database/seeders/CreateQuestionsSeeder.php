<?php

namespace Database\Seeders;

use App\Models\Module;
use App\Models\Question;
use Illuminate\Database\Seeder;

class CreateQuestionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        echo "========== CREATING QUESTIONS ==========\n\n";

        // Get modules
        $complianceModule = Module::where('title', 'Compliance & Code of Conduct')->first();
        $dataPrivacyModule = Module::where('title', 'Data Privacy & GDPR')->first();

        if (!$complianceModule) {
            echo "❌ Module 'Compliance & Code of Conduct' tidak ditemukan!\n";
            return;
        }

        if (!$dataPrivacyModule) {
            echo "❌ Module 'Data Privacy & GDPR' tidak ditemukan!\n";
            return;
        }

        // 10 SOAL PRE-TEST COMPLIANCE & CODE OF CONDUCT
        echo "1️⃣  Creating 10 Pre-test Questions for 'Compliance & Code of Conduct'...\n";
        
        $compliancePretest = [
            [
                'module_id' => $complianceModule->id,
                'question_text' => 'Apa yang dimaksud dengan compliance dalam organisasi?',
                'option_a' => 'Kepatuhan terhadap semua hukum, regulasi, dan standar internal perusahaan',
                'option_b' => 'Proses pemasaran produk perusahaan',
                'option_c' => 'Sistem manajemen sumber daya manusia',
                'option_d' => 'Strategi pengembangan produk baru',
                'correct_answer' => 'a',
                'question_type' => 'pretest',
                'difficulty' => 'easy',
            ],
            [
                'module_id' => $complianceModule->id,
                'question_text' => 'Siapa yang bertanggung jawab atas implementasi compliance di organisasi?',
                'option_a' => 'Hanya departemen legal',
                'option_b' => 'Semua karyawan dan manajemen',
                'option_c' => 'Hanya direktur utama',
                'option_d' => 'Tim audit eksternal',
                'correct_answer' => 'b',
                'question_type' => 'pretest',
                'difficulty' => 'easy',
            ],
            [
                'module_id' => $complianceModule->id,
                'question_text' => 'Apa dampak utama dari pelanggaran compliance?',
                'option_a' => 'Peningkatan efisiensi operasional',
                'option_b' => 'Denda, kehilangan kepercayaan, dan reputasi buruk',
                'option_c' => 'Peningkatan pangsa pasar',
                'option_d' => 'Pengurangan biaya operasional',
                'correct_answer' => 'b',
                'question_type' => 'pretest',
                'difficulty' => 'medium',
            ],
            [
                'module_id' => $complianceModule->id,
                'question_text' => 'Bagaimana seharusnya Anda bertindak ketika menemukan pelanggaran compliance?',
                'option_a' => 'Diam saja dan tidak melaporkan',
                'option_b' => 'Melaporkan langsung kepada atasan atau tim compliance',
                'option_c' => 'Membagikan informasi kepada rekan kerja',
                'option_d' => 'Menunggu sampai ada investigasi formal',
                'correct_answer' => 'b',
                'question_type' => 'pretest',
                'difficulty' => 'medium',
            ],
            [
                'module_id' => $complianceModule->id,
                'question_text' => 'Apa yang termasuk dalam Code of Conduct?',
                'option_a' => 'Hanya gaji dan tunjangan karyawan',
                'option_b' => 'Perilaku etis, integritas, dan standar profesional yang diharapkan',
                'option_c' => 'Jadwal kerja harian',
                'option_d' => 'Sistem cuti dan libur',
                'correct_answer' => 'b',
                'question_type' => 'pretest',
                'difficulty' => 'easy',
            ],
            [
                'module_id' => $complianceModule->id,
                'question_text' => 'Bagaimana menangani konflik kepentingan di tempat kerja?',
                'option_a' => 'Sembunyikan dari manajemen',
                'option_b' => 'Segera laporkan dan hindari situasi yang menguntungkan pribadi',
                'option_c' => 'Tanyakan kepada teman tentang cara mengatasinya',
                'option_d' => 'Abaikan selama tidak merugikan perusahaan',
                'correct_answer' => 'b',
                'question_type' => 'pretest',
                'difficulty' => 'medium',
            ],
            [
                'module_id' => $complianceModule->id,
                'question_text' => 'Apa tujuan utama dari audit compliance internal?',
                'option_a' => 'Menghukum karyawan yang melanggar',
                'option_b' => 'Memastikan organisasi mematuhi semua peraturan dan mengidentifikasi risiko',
                'option_c' => 'Mengurangi biaya operasional',
                'option_d' => 'Meningkatkan penjualan produk',
                'correct_answer' => 'b',
                'question_type' => 'pretest',
                'difficulty' => 'medium',
            ],
            [
                'module_id' => $complianceModule->id,
                'question_text' => 'Bagaimana cara membuat lingkungan kerja yang compliant?',
                'option_a' => 'Membuat peraturan tetapi tidak mengawasi',
                'option_b' => 'Komunikasi jelas, pelatihan, dan penerapan konsisten',
                'option_c' => 'Hanya mengandalkan tim legal',
                'option_d' => 'Tidak perlu melakukan apa-apa',
                'correct_answer' => 'b',
                'question_type' => 'pretest',
                'difficulty' => 'medium',
            ],
            [
                'module_id' => $complianceModule->id,
                'question_text' => 'Apa yang dimaksud dengan whistleblower?',
                'option_a' => 'Karyawan yang selalu memberi tahu manajemen tentang gosip',
                'option_b' => 'Orang yang melaporkan pelanggaran compliance atau hukum secara jujur',
                'option_c' => 'Tim yang mengaudit keuangan perusahaan',
                'option_d' => 'Departemen yang menangani keluhan pelanggan',
                'correct_answer' => 'b',
                'question_type' => 'pretest',
                'difficulty' => 'medium',
            ],
            [
                'module_id' => $complianceModule->id,
                'question_text' => 'Bagaimana perlindungan terhadap whistleblower?',
                'option_a' => 'Tidak ada perlindungan',
                'option_b' => 'Perlindungan dari pembalasan dan jaminan kerahasiaan identitas',
                'option_c' => 'Hanya perlindungan melalui pengadilan',
                'option_d' => 'Hanya mendapat kompensasi uang',
                'correct_answer' => 'b',
                'question_type' => 'pretest',
                'difficulty' => 'hard',
            ],
        ];

        foreach ($compliancePretest as $q) {
            Question::create($q);
        }
        echo "   ✅ 10 soal pre-test berhasil ditambahkan!\n\n";

        // 10 SOAL POST-TEST DATA PRIVACY & GDPR
        echo "2️⃣  Creating 10 Post-test Questions for 'Data Privacy & GDPR'...\n";

        $dataPrivacyPosttest = [
            [
                'module_id' => $dataPrivacyModule->id,
                'question_text' => 'Apa kepanjangan dari GDPR?',
                'option_a' => 'General Data Protection Regulation',
                'option_b' => 'Global Digital Privacy Rule',
                'option_c' => 'Government Data Processing Requirements',
                'option_d' => 'General Data Privacy Rights',
                'correct_answer' => 'a',
                'question_type' => 'posttest',
                'difficulty' => 'easy',
            ],
            [
                'module_id' => $dataPrivacyModule->id,
                'question_text' => 'Di mana GDPR berlaku?',
                'option_a' => 'Hanya di Amerika Serikat',
                'option_b' => 'Hanya di Uni Eropa',
                'option_c' => 'Di Uni Eropa dan untuk organisasi yang melayani EU citizens',
                'option_d' => 'Di seluruh dunia tanpa batasan',
                'correct_answer' => 'c',
                'question_type' => 'posttest',
                'difficulty' => 'medium',
            ],
            [
                'module_id' => $dataPrivacyModule->id,
                'question_text' => 'Apa hak dasar yang dilindungi oleh GDPR?',
                'option_a' => 'Hak untuk akses, koreksi, dan penghapusan data pribadi',
                'option_b' => 'Hanya hak untuk mendapatkan pekerjaan',
                'option_c' => 'Hanya hak untuk berbelanja online',
                'option_d' => 'Hanya hak untuk menggunakan media sosial',
                'correct_answer' => 'a',
                'question_type' => 'posttest',
                'difficulty' => 'medium',
            ],
            [
                'module_id' => $dataPrivacyModule->id,
                'question_text' => 'Apa yang dimaksud dengan "Right to be Forgotten"?',
                'option_a' => 'Hak untuk tidak mengingat informasi pribadi',
                'option_b' => 'Hak untuk meminta penghapusan data pribadi Anda',
                'option_c' => 'Hak untuk tidak mendapat notifikasi',
                'option_d' => 'Hak untuk menolak semua komunikasi',
                'correct_answer' => 'b',
                'question_type' => 'posttest',
                'difficulty' => 'medium',
            ],
            [
                'module_id' => $dataPrivacyModule->id,
                'question_text' => 'Berapa maksimal denda untuk pelanggaran GDPR?',
                'option_a' => 'Maksimal 10.000 EUR',
                'option_b' => 'Maksimal hingga 20 juta EUR atau 4% dari revenue global',
                'option_c' => 'Tidak ada denda, hanya peringatan',
                'option_d' => 'Maksimal 100.000 EUR',
                'correct_answer' => 'b',
                'question_type' => 'posttest',
                'difficulty' => 'hard',
            ],
            [
                'module_id' => $dataPrivacyModule->id,
                'question_text' => 'Apa yang harus dilakukan jika terjadi data breach?',
                'option_a' => 'Sembunyikan dari publik',
                'option_b' => 'Laporkan kepada otoritas dan individu yang terkena dalam 72 jam',
                'option_c' => 'Hanya laporkan ke kepemimpinan internal',
                'option_d' => 'Tunggu sampai ada gugatan dari pelanggan',
                'correct_answer' => 'b',
                'question_type' => 'posttest',
                'difficulty' => 'hard',
            ],
            [
                'module_id' => $dataPrivacyModule->id,
                'question_text' => 'Apa adalah Data Protection Officer (DPO)?',
                'option_a' => 'Orang yang menghapus semua data perusahaan',
                'option_b' => 'Individu yang mengawasi compliance data privacy di organisasi',
                'option_c' => 'Karyawan yang hanya mengelola sistem backup',
                'option_d' => 'Tim yang menangani complain pelanggan',
                'correct_answer' => 'b',
                'question_type' => 'posttest',
                'difficulty' => 'medium',
            ],
            [
                'module_id' => $dataPrivacyModule->id,
                'question_text' => 'Apa itu Data Processing Agreement (DPA)?',
                'option_a' => 'Perjanjian antara penjual dan pembeli produk',
                'option_b' => 'Perjanjian yang mengatur bagaimana data diproses oleh vendor pihak ketiga',
                'option_c' => 'Perjanjian tentang upah karyawan',
                'option_d' => 'Perjanjian tentang jam kerja',
                'correct_answer' => 'b',
                'question_type' => 'posttest',
                'difficulty' => 'medium',
            ],
            [
                'module_id' => $dataPrivacyModule->id,
                'question_text' => 'Bagaimana cara melindungi data pribadi karyawan?',
                'option_a' => 'Tidak perlu melindungi, data internal tidak penting',
                'option_b' => 'Enkripsi, limited access, dan secure backup',
                'option_c' => 'Hanya melindungi data pelanggan, bukan karyawan',
                'option_d' => 'Bagikan ke semua karyawan tanpa batasan',
                'correct_answer' => 'b',
                'question_type' => 'posttest',
                'difficulty' => 'medium',
            ],
            [
                'module_id' => $dataPrivacyModule->id,
                'question_text' => 'Apa tanggung jawab utama organisasi terhadap data pribadi?',
                'option_a' => 'Memaksimalkan keuntungan dari penjualan data',
                'option_b' => 'Melindungi, memproses secara transparan, dan memberikan kontrol kepada individu',
                'option_c' => 'Mengumpulkan sebanyak mungkin data tanpa batas',
                'option_d' => 'Tidak ada tanggung jawab khusus',
                'correct_answer' => 'b',
                'question_type' => 'posttest',
                'difficulty' => 'hard',
            ],
        ];

        foreach ($dataPrivacyPosttest as $q) {
            Question::create($q);
        }
        echo "   ✅ 10 soal post-test berhasil ditambahkan!\n\n";

        echo "========== SUMMARY ==========\n";
        echo "✅ Total 20 soal berhasil dibuat dan ditambahkan ke database:\n";
        echo "   • 10 Pre-test untuk 'Compliance & Code of Conduct'\n";
        echo "   • 10 Post-test untuk 'Data Privacy & GDPR'\n";
        echo "\n";
    }
}
