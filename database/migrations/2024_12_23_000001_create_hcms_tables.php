<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Update Tabel Users (Menambah NIP & Role)
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'nip')) {
                $table->string('nip')->unique()->nullable()->after('id'); // Nomor Induk Pegawai
            }
            if (!Schema::hasColumn('users', 'role')) {
                $table->string('role')->default('user')->after('email'); // 'admin' or 'user'
            }
            if (!Schema::hasColumn('users', 'status')) {
                $table->enum('status', ['active', 'inactive'])->default('active')->after('role'); // Status aktif/nonaktif
            }
            if (!Schema::hasColumn('users', 'department')) {
                $table->string('department')->nullable(); // Unit/Cabang
            }
        });

        // 2. Tabel Modules (Materi Training)
        Schema::create('modules', function (Blueprint $table) {
            $table->id();
            $table->string('title'); // Judul materi (misal: "Anti Money Laundering")
            $table->text('description')->nullable(); // Deskripsi materi
            $table->string('video_url')->nullable(); // Link/Path file video
            $table->string('document_url')->nullable(); // Link/Path file PDF
            $table->string('presentation_url')->nullable(); // Link/Path file PPT
            $table->integer('passing_grade')->default(70); // KKM (Kriteria Ketuntasan Minimal)
            $table->boolean('has_pretest')->default(false); // Sesuai Flowchart: Need Test?
            $table->boolean('is_active')->default(true); // Status aktif/non-aktif
            $table->timestamps();
        });

        // 3. Tabel Questions (Bank Soal untuk Pre-test & Post-test)
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->constrained('modules')->onDelete('cascade');
            $table->text('question_text'); // Isi pertanyaan
            $table->string('option_a'); // Pilihan A
            $table->string('option_b'); // Pilihan B
            $table->string('option_c'); // Pilihan C
            $table->string('option_d'); // Pilihan D
            $table->char('correct_answer'); // Kunci jawaban: 'a', 'b', 'c', atau 'd'
            $table->timestamps();
        });

        // 4. Tabel Module Progress (Mencatat progres belajar user per materi)
        Schema::create('module_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('module_id')->constrained('modules')->onDelete('cascade');
            // Status alur:
            // 'locked' = User belum bisa akses (pre-req tidak terpenuhi)
            // 'in_progress' = User sedang belajar (sudah mulai nonton/baca)
            // 'completed' = User selesai materi (bisa ambil post-test)
            $table->enum('status', ['locked', 'in_progress', 'completed'])->default('locked');
            $table->decimal('progress_percentage', 5, 2)->default(0); // Persentase progress nonton video (%)
            $table->timestamp('last_accessed_at')->nullable(); // Kapan terakhir diakses
            $table->timestamps();
            
            // Unique constraint: 1 user hanya bisa punya 1 progress per module
            $table->unique(['user_id', 'module_id']);
        });

        // 5. Tabel Exam Attempts (Riwayat Ujian untuk Audit & Laporan OJK)
        // Tabel ini adalah yang paling KRUSIAL untuk compliance OJK
        Schema::create('exam_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('module_id')->constrained('modules')->onDelete('cascade');
            // Type ujian: pre-test (sebelum materi) atau post-test (setelah materi)
            $table->enum('exam_type', ['pre_test', 'post_test']);
            $table->integer('score'); // Nilai mentah (0-100)
            $table->decimal('percentage', 5, 2); // Persentase nilai (0-100)
            $table->boolean('is_passed')->default(false); // Lulus atau tidak (sesuai passing_grade)
            // Waktu untuk audit trail
            $table->timestamp('started_at')->useCurrent(); // Kapan user mulai ujian
            $table->timestamp('finished_at')->nullable(); // Kapan user selesai ujian
            // Durasi pengerjaan (dalam menit) - untuk bukti user benar-benar mengerjakan
            $table->integer('duration_minutes')->nullable();
            $table->timestamps();
            
            // Index untuk query report cepat
            $table->index(['user_id', 'module_id']);
            $table->index(['exam_type', 'is_passed']);
        });

        // 6. Tabel User Answers (Riwayat jawaban user per soal - detail untuk audit)
        Schema::create('user_exam_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_attempt_id')->constrained('exam_attempts')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('question_id')->constrained('questions')->onDelete('cascade');
            $table->char('user_answer'); // Jawaban user: 'a', 'b', 'c', atau 'd'
            $table->char('correct_answer'); // Kunci jawaban (untuk cepat lihat benar/salah)
            $table->boolean('is_correct')->default(false); // Apakah jawaban benar
            $table->timestamps();
        });

        // 7. Tabel User Trainings (Enrollments - user daftar ke training)
        Schema::create('user_trainings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('module_id')->constrained('modules')->onDelete('cascade');
            // Status enrollment
            $table->enum('status', ['enrolled', 'in_progress', 'completed', 'failed'])->default('enrolled');
            // Nilai akhir training (dari post-test terbaik)
            $table->integer('final_score')->nullable();
            $table->boolean('is_certified')->default(false); // Apakah sudah dapat sertifikat
            $table->timestamp('enrolled_at')->useCurrent();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            
            // Unique: 1 user hanya bisa enroll 1x per module (tapi bisa re-attempt)
            $table->unique(['user_id', 'module_id']);
        });

        // 8. Tabel Audit Logs (Untuk compliance OJK - tracking semua aktivitas)
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('action'); // 'login', 'start_exam', 'submit_exam', 'download_material', dll
            $table->string('entity_type')->nullable(); // 'module', 'exam', 'user', dll
            $table->unsignedBigInteger('entity_id')->nullable(); // ID dari entity
            $table->json('changes')->nullable(); // Detail perubahan (JSON format)
            $table->string('ip_address')->nullable(); // IP user (untuk security)
            $table->timestamp('logged_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('user_exam_answers');
        Schema::dropIfExists('user_trainings');
        Schema::dropIfExists('exam_attempts');
        Schema::dropIfExists('module_progress');
        Schema::dropIfExists('questions');
        Schema::dropIfExists('modules');
        
        // Rollback kolom users
        Schema::table('users', function (Blueprint $table) {
            // Drop unique index first if exists
            try {
                $table->dropUnique(['nip']);
            } catch (\Exception $e) {
                // Index doesn't exist, continue
            }
            
            if (Schema::hasColumn('users', 'nip')) {
                $table->dropColumn('nip');
            }
            if (Schema::hasColumn('users', 'role')) {
                $table->dropColumn('role');
            }
            if (Schema::hasColumn('users', 'department')) {
                $table->dropColumn('department');
            }
        });
    }
};
