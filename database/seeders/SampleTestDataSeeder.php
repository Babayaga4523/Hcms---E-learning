<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Module;
use App\Models\Question;

class SampleTestDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Buat 5 module sample
        $modules = [
            [
                'title' => 'Anti Money Laundering (AML)',
                'description' => 'Pelatihan tentang pencegahan pencucian uang',
                'passing_grade' => 70,
                'is_active' => true
            ],
            [
                'title' => 'Know Your Customer (KYC)',
                'description' => 'Pelatihan tentang pengenalan pelanggan',
                'passing_grade' => 75,
                'is_active' => true
            ],
            [
                'title' => 'Compliance & Risk Management',
                'description' => 'Pelatihan tentang kepatuhan dan manajemen risiko',
                'passing_grade' => 70,
                'is_active' => true
            ],
            [
                'title' => 'Data Security & Privacy',
                'description' => 'Pelatihan tentang keamanan data dan privasi',
                'passing_grade' => 80,
                'is_active' => true
            ],
            [
                'title' => 'Customer Service Excellence',
                'description' => 'Pelatihan tentang pelayanan pelanggan yang unggul',
                'passing_grade' => 70,
                'is_active' => true
            ]
        ];

        foreach ($modules as $moduleData) {
            $module = Module::create($moduleData);

            // Tambah 10 pertanyaan untuk setiap module
            $questions = [
                [
                    'question_text' => 'Apa itu Money Laundering?',
                    'option_a' => 'Proses pencucian uang tunai di mesin cuci',
                    'option_b' => 'Proses menyembunyikan asal-usul uang ilegal melalui transaksi kompleks',
                    'option_c' => 'Proses mengirim uang ke luar negeri',
                    'option_d' => 'Proses menukar mata uang',
                    'correct_answer' => 'b'
                ],
                [
                    'question_text' => 'Berapa jumlah threshold pelaporan transaksi mencurigakan menurut regulasi?',
                    'option_a' => 'Rp 100 juta',
                    'option_b' => 'Rp 500 juta',
                    'option_c' => 'Rp 1 miliar',
                    'option_d' => 'Tidak ada batasan jumlah',
                    'correct_answer' => 'a'
                ],
                [
                    'question_text' => 'Siapa yang bertanggung jawab melaporkan transaksi mencurigakan?',
                    'option_a' => 'Hanya bagian compliance',
                    'option_b' => 'Semua karyawan yang berinteraksi dengan pelanggan',
                    'option_c' => 'Hanya manajemen senior',
                    'option_d' => 'Departemen keamanan saja',
                    'correct_answer' => 'b'
                ],
                [
                    'question_text' => 'Apa yang dimaksud dengan Red Flag dalam AML?',
                    'option_a' => 'Bendera merah di kantor',
                    'option_b' => 'Indikator atau tanda peringatan transaksi mencurigakan',
                    'option_c' => 'Laporan bulanan kepada OJK',
                    'option_d' => 'Sertifikat kepatuhan',
                    'correct_answer' => 'b'
                ],
                [
                    'question_text' => 'Berapa lama dokumen AML harus disimpan?',
                    'option_a' => '1 tahun',
                    'option_b' => '3 tahun',
                    'option_c' => '5 tahun',
                    'option_d' => '10 tahun',
                    'correct_answer' => 'c'
                ],
                [
                    'question_text' => 'Apa kepanjangan dari KYC?',
                    'option_a' => 'Know Your Client',
                    'option_b' => 'Keep Your Card',
                    'option_c' => 'Key Yield Calculation',
                    'option_d' => 'Knowledge Year Cycle',
                    'correct_answer' => 'a'
                ],
                [
                    'question_text' => 'Dokumen apa yang diperlukan untuk verifikasi identitas?',
                    'option_a' => 'Hanya KTP',
                    'option_b' => 'KTP dan bukti alamat',
                    'option_c' => 'Hanya paspor',
                    'option_d' => 'Surat dari RT',
                    'correct_answer' => 'b'
                ],
                [
                    'question_text' => 'Apa tujuan utama program KYC?',
                    'option_a' => 'Meningkatkan profit',
                    'option_b' => 'Mencegah fraud dan money laundering',
                    'option_c' => 'Mengurangi biaya operasional',
                    'option_d' => 'Meningkatkan kepuasan pelanggan',
                    'correct_answer' => 'b'
                ],
                [
                    'question_text' => 'Berapa usia minimum untuk membuka rekening?',
                    'option_a' => '15 tahun',
                    'option_b' => '17 tahun',
                    'option_c' => '18 tahun',
                    'option_d' => '21 tahun',
                    'correct_answer' => 'c'
                ],
                [
                    'question_text' => 'Siapa yang melakukan due diligence berkelanjutan?',
                    'option_a' => 'Hanya bagian marketing',
                    'option_b' => 'Hanya bagian compliance',
                    'option_c' => 'Semua unit bisnis secara berkelanjutan',
                    'option_d' => 'Hanya saat customer bertanya',
                    'correct_answer' => 'c'
                ]
            ];

            foreach ($questions as $questionData) {
                $questionData['module_id'] = $module->id;
                Question::create($questionData);
            }
        }

        echo "✓ Sample test data berhasil dibuat: 5 modules dengan 10 pertanyaan masing-masing\n";
    }
}
