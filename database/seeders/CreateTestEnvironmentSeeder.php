<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Module;
use App\Models\Question;
use App\Models\UserTraining;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CreateTestEnvironmentSeeder extends Seeder
{
    public function run()
    {
        echo "\n=== CREATING TEST ENVIRONMENT ===\n\n";

        try {
            // 1. CREATE ADMIN USER
            echo "1. Creating Admin User...\n";
            
            // Delete if exists to start fresh
            User::where('email', 'admin@example.com')->delete();
            
            // Create new admin user
            $admin = User::create([
                'name' => 'Admin User',
                'nip' => 'ADM000001',
                'email' => 'admin@example.com',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'department' => 'IT',
                'location' => 'Jakarta',
                'status' => 'active',
            ]);
            
            echo "   ✓ Admin created: {$admin->name}\n";
            echo "   ✓ Email: admin@example.com\n";
            echo "   ✓ Password: password (hashed)\n";

            // 2. CREATE 10 REGULAR USERS
            echo "\n2. Creating 10 Regular Users...\n";
            $firstNames = ['Ahmad', 'Budi', 'Citra', 'Dewi', 'Eka', 'Fitri', 'Gita', 'Hadi', 'Ika', 'Joko'];
            $lastNames = ['Wijaya', 'Santoso', 'Rahmadani', 'Kusuma', 'Pratama', 'Setiyawan', 'Handoko', 'Iswanto', 'Jayanti', 'Kusumah'];
            $departments = ['IT', 'HR', 'Finance', 'Marketing', 'Operations'];

            $userIds = [];
            for ($i = 0; $i < 10; $i++) {
                $dept = $departments[$i % count($departments)];
                $fullName = $firstNames[$i] . ' ' . $lastNames[$i];
                $nip = 'EMP' . str_pad($i + 1, 5, '0', STR_PAD_LEFT);

                $user = User::updateOrCreate(
                    ['nip' => $nip],
                    [
                        'name' => $fullName,
                        'nip' => $nip,
                        'email' => strtolower(str_replace(' ', '.', $fullName)) . '@company.com',
                        'password' => Hash::make('password'),
                        'role' => 'user',
                        'department' => $dept,
                        'location' => 'Jakarta',
                        'status' => 'active',
                    ]
                );
                $userIds[] = $user->id;
                $userNum = $i + 1;
                echo "   ✓ User {$userNum}: {$user->name}\n";
            }

            // 3. CREATE 2 PROGRAMS/MODULES
            echo "\n3. Creating 2 Programs with Questions...\n";

            $programs = [
                [
                    'title' => 'Compliance & Code of Conduct',
                    'description' => 'Pelajari kebijakan perusahaan dan kode etik profesional',
                    'pretest_count' => 5,
                    'posttest_count' => 5,
                ],
                [
                    'title' => 'Data Privacy & GDPR',
                    'description' => 'Pelindungan data pelanggan dan regulasi privasi global',
                    'pretest_count' => 5,
                    'posttest_count' => 5,
                ],
            ];

            $moduleIds = [];

            foreach ($programs as $idx => $prog) {
                $module = Module::updateOrCreate(
                    ['title' => $prog['title']],
                    [
                        'title' => $prog['title'],
                        'description' => $prog['description'],
                        'is_active' => true,
                    ]
                );
                $moduleIds[] = $module->id;
                $progNum = $idx + 1;
                echo "   ✓ Program {$progNum}: {$module->title}\n";

                // Define questions based on program
                if ($idx === 0) {
                    // PROGRAM 1: Compliance & Code of Conduct
                    $allQuestions = $this->getComplianceQuestions();
                } else {
                    // PROGRAM 2: Data Privacy & GDPR
                    $allQuestions = $this->getPrivacyQuestions();
                }

                // Create PreTest Questions (5)
                echo "      Creating 5 Pre-Test Questions...\n";
                $preTestQuestions = $allQuestions['pretest'];

                foreach ($preTestQuestions as $qIdx => $qData) {
                    Question::updateOrCreate(
                        [
                            'module_id' => $module->id,
                            'question_text' => $qData['question_text'],
                        ],
                        [
                            'module_id' => $module->id,
                            'question_text' => $qData['question_text'],
                            'option_a' => $qData['option_a'],
                            'option_b' => $qData['option_b'],
                            'option_c' => $qData['option_c'],
                            'option_d' => $qData['option_d'],
                            'correct_answer' => $qData['correct_answer'],
                        ]
                    );
                }
                echo "      ✓ 5 Pre-Test Questions created\n";

                // Create PostTest Questions (5)
                echo "      Creating 5 Post-Test Questions...\n";
                $postTestQuestions = $allQuestions['posttest'];

                foreach ($postTestQuestions as $qIdx => $qData) {
                    Question::updateOrCreate(
                        [
                            'module_id' => $module->id,
                            'question_text' => $qData['question_text'],
                        ],
                        [
                            'module_id' => $module->id,
                            'question_text' => $qData['question_text'],
                            'option_a' => $qData['option_a'],
                            'option_b' => $qData['option_b'],
                            'option_c' => $qData['option_c'],
                            'option_d' => $qData['option_d'],
                            'correct_answer' => $qData['correct_answer'],
                        ]
                    );
                }
                echo "      ✓ 5 Post-Test Questions created\n";
            }

            // 4. ENROLL USERS TO MODULES
            echo "\n4. Enrolling Users to Programs...\n";
            foreach ($userIds as $userId) {
                foreach ($moduleIds as $moduleId) {
                    UserTraining::updateOrCreate(
                        [
                            'user_id' => $userId,
                            'module_id' => $moduleId,
                        ],
                        [
                            'user_id' => $userId,
                            'module_id' => $moduleId,
                            'status' => 'enrolled',
                            'enrolled_at' => now(),
                        ]
                    );
                }
            }
            echo "   ✓ All users enrolled to both programs\n";

            echo "\n=== SUMMARY ===\n";
            echo "✓ 1 Admin User created\n";
            echo "✓ 10 Regular Users created\n";
            echo "✓ 2 Programs created\n";
            echo "✓ 20 Questions total (10 per program: 5 pre-test + 5 post-test)\n";
            echo "✓ All users enrolled to both programs\n";
            echo "\n✅ TEST ENVIRONMENT CREATED SUCCESSFULLY!\n";
            echo "Access dashboard at: http://localhost:8000/admin/dashboard\n";
            echo "Admin login: admin@example.com / password\n\n";

        } catch (\Exception $e) {
            echo "❌ Error: " . $e->getMessage() . "\n";
            throw $e;
        }
    }

    /**
     * Get Compliance & Code of Conduct questions
     */
    private function getComplianceQuestions()
    {
        return [
            'pretest' => [
                [
                    'question_text' => 'Apa yang dimaksud dengan Kode Etik Profesional?',
                    'option_a' => 'Standar perilaku profesional',
                    'option_b' => 'Peraturan lalu lintas',
                    'option_c' => 'Hukum dagang',
                    'option_d' => 'Standar keselamatan kerja',
                    'correct_answer' => 'a',
                ],
                [
                    'question_text' => 'Siapa yang bertanggung jawab atas kepatuhan terhadap kebijakan perusahaan?',
                    'option_a' => 'Hanya manajemen',
                    'option_b' => 'Hanya HR',
                    'option_c' => 'Semua karyawan',
                    'option_d' => 'Hanya direktur',
                    'correct_answer' => 'c',
                ],
                [
                    'question_text' => 'Kapan sebaiknya melaporkan pelanggaran kebijakan?',
                    'option_a' => 'Tidak perlu dilaporkan',
                    'option_b' => 'Segera setelah mengetahui',
                    'option_c' => 'Tunggu sampai ada instruksi',
                    'option_d' => 'Hanya jika diminta audit',
                    'correct_answer' => 'b',
                ],
                [
                    'question_text' => 'Apa tujuan utama dari kode etik perusahaan?',
                    'option_a' => 'Membatasi kebebasan kerja',
                    'option_b' => 'Menjaga reputasi dan kepercayaan',
                    'option_c' => 'Menghukum karyawan',
                    'option_d' => 'Mengurangi gaji',
                    'correct_answer' => 'b',
                ],
                [
                    'question_text' => 'Bagaimana seharusnya menangani konflik kepentingan?',
                    'option_a' => 'Didiamkan',
                    'option_b' => 'Diungkapkan kepada atasan',
                    'option_c' => 'Diselesaikan sendiri',
                    'option_d' => 'Diberitahu ke media',
                    'correct_answer' => 'b',
                ],
            ],
            'posttest' => [
                [
                    'question_text' => 'Setelah pelatihan ini, apa yang akan Anda lakukan jika melihat pelanggaran?',
                    'option_a' => 'Diam saja',
                    'option_b' => 'Laporkan ke HR/Manajemen',
                    'option_c' => 'Beri tahu teman',
                    'option_d' => 'Buat laporan ke media sosial',
                    'correct_answer' => 'b',
                ],
                [
                    'question_text' => 'Implementasi kode etik dalam pekerjaan sehari-hari mencakup:',
                    'option_a' => 'Jujur dan integritas',
                    'option_b' => 'Hormat kepada kolega',
                    'option_c' => 'Transparansi',
                    'option_d' => 'Semua jawaban benar',
                    'correct_answer' => 'd',
                ],
                [
                    'question_text' => 'Apa risiko jika tidak mematuhi kode etik perusahaan?',
                    'option_a' => 'Tidak ada risiko',
                    'option_b' => 'Teguran atau pemecatan',
                    'option_c' => 'Hanya penurunan gaji',
                    'option_d' => 'Pindah departemen',
                    'correct_answer' => 'b',
                ],
                [
                    'question_text' => 'Bagaimana Anda akan mengkomunikasikan nilai-nilai etika kepada tim?',
                    'option_a' => 'Memberi contoh baik',
                    'option_b' => 'Berdiskusi terbuka',
                    'option_c' => 'Dokumentasi jelas',
                    'option_d' => 'Semua jawaban benar',
                    'correct_answer' => 'd',
                ],
                [
                    'question_text' => 'Pelatihan kode etik ini paling bermanfaat untuk:',
                    'option_a' => 'Memahami aturan saja',
                    'option_b' => 'Mengubah budaya kerja positif',
                    'option_c' => 'Menghindari hukuman',
                    'option_d' => 'Naik jabatan',
                    'correct_answer' => 'b',
                ],
            ],
        ];
    }

    /**
     * Get Data Privacy & GDPR questions
     */
    private function getPrivacyQuestions()
    {
        return [
            'pretest' => [
                [
                    'question_text' => 'Apa singkatan GDPR?',
                    'option_a' => 'General Data Protection Regulation',
                    'option_b' => 'General Digital Processing Rights',
                    'option_c' => 'Global Data Processing Registry',
                    'option_d' => 'General Database Protection Registry',
                    'correct_answer' => 'a',
                ],
                [
                    'question_text' => 'Negara mana yang menerbitkan GDPR?',
                    'option_a' => 'Amerika Serikat',
                    'option_b' => 'Uni Eropa',
                    'option_c' => 'Indonesia',
                    'option_d' => 'Kanada',
                    'correct_answer' => 'b',
                ],
                [
                    'question_text' => 'Apa hak dasar dalam perlindungan data pribadi?',
                    'option_a' => 'Hak untuk dilupakan',
                    'option_b' => 'Hak akses data',
                    'option_c' => 'Hak membatasi pemrosesan',
                    'option_d' => 'Semua jawaban benar',
                    'correct_answer' => 'd',
                ],
                [
                    'question_text' => 'Siapa yang bertanggung jawab atas perlindungan data?',
                    'option_a' => 'Hanya IT Department',
                    'option_b' => 'Hanya Compliance Team',
                    'option_c' => 'Semua karyawan',
                    'option_d' => 'Hanya Data Protection Officer',
                    'correct_answer' => 'c',
                ],
                [
                    'question_text' => 'Apa yang harus dilakukan jika terjadi pelanggaran data?',
                    'option_a' => 'Diam dan tunggu',
                    'option_b' => 'Laporkan ke pihak yang berwenang',
                    'option_c' => 'Hapus semua bukti',
                    'option_d' => 'Beritahu pesaing',
                    'correct_answer' => 'b',
                ],
            ],
            'posttest' => [
                [
                    'question_text' => 'Tindakan apa yang akan Anda ambil untuk melindungi data pelanggan?',
                    'option_a' => 'Bagikan dengan siapa saja',
                    'option_b' => 'Enkripsi dan batasi akses',
                    'option_c' => 'Simpan tanpa keamanan',
                    'option_d' => 'Jual kepada pihak ketiga',
                    'correct_answer' => 'b',
                ],
                [
                    'question_text' => 'Berapa lama sebaiknya menyimpan data pribadi?',
                    'option_a' => 'Selamanya',
                    'option_b' => 'Sesuai kebutuhan dan peraturan',
                    'option_c' => 'Hanya satu hari',
                    'option_d' => 'Tidak perlu menyimpan',
                    'correct_answer' => 'b',
                ],
                [
                    'question_text' => 'Apa konsekuensi melanggar GDPR?',
                    'option_a' => 'Tidak ada',
                    'option_b' => 'Denda dan reputasi rusak',
                    'option_c' => 'Hanya teguran lisan',
                    'option_d' => 'Mengganti gaji',
                    'correct_answer' => 'b',
                ],
                [
                    'question_text' => 'Bagaimana menangani permintaan akses data dari subjek data?',
                    'option_a' => 'Tolak semua permintaan',
                    'option_b' => 'Penuhi dalam waktu 30 hari',
                    'option_c' => 'Abaikan permintaan',
                    'option_d' => 'Hanya beri kepada atasan',
                    'correct_answer' => 'b',
                ],
                [
                    'question_text' => 'Manfaat utama kepatuhan GDPR adalah:',
                    'option_a' => 'Meningkatkan kepercayaan pelanggan',
                    'option_b' => 'Melindungi reputasi perusahaan',
                    'option_c' => 'Menghindari denda besar',
                    'option_d' => 'Semua jawaban benar',
                    'correct_answer' => 'd',
                ],
            ],
        ];
    }
}
