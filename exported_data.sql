-- Exported from SQLite to MySQL

CREATE TABLE `migrations` (
`id` INT NOT NULL ,
`migration` VARCHAR(255) NOT NULL ,
`batch` INT NOT NULL 
);

INSERT INTO `migrations` VALUES ('1', '1', '0001_01_01_000000_create_users_table', '0001_01_01_000000_create_users_table', '1', '1');
INSERT INTO `migrations` VALUES ('2', '2', '0001_01_01_000001_create_cache_table', '0001_01_01_000001_create_cache_table', '1', '1');
INSERT INTO `migrations` VALUES ('3', '3', '0001_01_01_000002_create_jobs_table', '0001_01_01_000002_create_jobs_table', '1', '1');
INSERT INTO `migrations` VALUES ('4', '4', '2024_12_23_000001_create_hcms_tables', '2024_12_23_000001_create_hcms_tables', '1', '1');
INSERT INTO `migrations` VALUES ('5', '5', '2024_12_25_add_answers_to_questions_table', '2024_12_25_add_answers_to_questions_table', '1', '1');
INSERT INTO `migrations` VALUES ('6', '6', '2024_12_25_add_quiz_generator_fields_table', '2024_12_25_add_quiz_generator_fields_table', '1', '1');
INSERT INTO `migrations` VALUES ('7', '7', '2024_12_25_create_content_uploads_table', '2024_12_25_create_content_uploads_table', '1', '1');
INSERT INTO `migrations` VALUES ('8', '8', '2024_12_25_create_reminders_table', '2024_12_25_create_reminders_table', '1', '1');
INSERT INTO `migrations` VALUES ('9', '9', '2025_12_24_000002_create_program_approvals_table', '2025_12_24_000002_create_program_approvals_table', '1', '1');
INSERT INTO `migrations` VALUES ('10', '10', '2025_12_24_000003_create_compliance_evidences_table', '2025_12_24_000003_create_compliance_evidences_table', '1', '1');
INSERT INTO `migrations` VALUES ('11', '11', '2025_12_24_000004_create_program_templates_table', '2025_12_24_000004_create_program_templates_table', '1', '1');
INSERT INTO `migrations` VALUES ('12', '12', '2025_12_24_000005_create_program_notifications_table', '2025_12_24_000005_create_program_notifications_table', '1', '1');
INSERT INTO `migrations` VALUES ('13', '13', '2025_12_24_000006_create_program_enrollment_metrics_table', '2025_12_24_000006_create_program_enrollment_metrics_table', '1', '1');
INSERT INTO `migrations` VALUES ('14', '14', '2025_12_24_000007_add_new_columns_to_modules_table', '2025_12_24_000007_add_new_columns_to_modules_table', '1', '1');
INSERT INTO `migrations` VALUES ('15', '15', '2025_12_24_035724_add_status_to_users_table', '2025_12_24_035724_add_status_to_users_table', '1', '1');
INSERT INTO `migrations` VALUES ('16', '16', '2025_12_24_040101_add_department_to_users_table', '2025_12_24_040101_add_department_to_users_table', '1', '1');
INSERT INTO `migrations` VALUES ('17', '17', '2025_12_24_120000_add_training_program_features', '2025_12_24_120000_add_training_program_features', '1', '1');
INSERT INTO `migrations` VALUES ('18', '18', '2025_12_25_000000_add_priority_to_module_assignments', '2025_12_25_000000_add_priority_to_module_assignments', '1', '1');
INSERT INTO `migrations` VALUES ('19', '19', '2025_12_25_000001_create_roles_permissions_departments', '2025_12_25_000001_create_roles_permissions_departments', '1', '1');
INSERT INTO `migrations` VALUES ('20', '20', '2025_12_26_000001_create_training_schedules_table', '2025_12_26_000001_create_training_schedules_table', '1', '1');
INSERT INTO `migrations` VALUES ('21', '21', '2025_12_26_000002_create_announcements_table', '2025_12_26_000002_create_announcements_table', '1', '1');
INSERT INTO `migrations` VALUES ('22', '22', '2025_12_27_000010_add_recipients_fields_to_program_notifications_table', '2025_12_27_000010_add_recipients_fields_to_program_notifications_table', '1', '1');
INSERT INTO `migrations` VALUES ('23', '23', '2025_12_27_000011_make_module_and_user_id_nullable_in_program_notifications', '2025_12_27_000011_make_module_and_user_id_nullable_in_program_notifications', '1', '1');
INSERT INTO `migrations` VALUES ('24', '24', '2025_12_29_000000_add_pretest_posttest_question_types', '2025_12_29_000000_add_pretest_posttest_question_types', '2', '2');
INSERT INTO `migrations` VALUES ('25', '25', '2025_01_08_add_cover_image_xp_to_modules_table', '2025_01_08_add_cover_image_xp_to_modules_table', '3', '3');
INSERT INTO `migrations` VALUES ('26', '26', '2025_12_29_045448_add_pdf_path_to_training_materials_table', '2025_12_29_045448_add_pdf_path_to_training_materials_table', '4', '4');
INSERT INTO `migrations` VALUES ('27', '27', '2025_12_29_063915_add_cover_image_to_modules_table', '2025_12_29_063915_add_cover_image_to_modules_table', '5', '5');
INSERT INTO `migrations` VALUES ('28', '28', '2025_12_29_070517_add_trainer_ids_to_training_schedules_table', '2025_12_29_070517_add_trainer_ids_to_training_schedules_table', '6', '6');
INSERT INTO `migrations` VALUES ('29', '29', '2025_12_29_070522_add_trainer_ids_to_training_schedules_table', '2025_12_29_070522_add_trainer_ids_to_training_schedules_table', '6', '6');
INSERT INTO `migrations` VALUES ('30', '30', '2025_12_29_add_image_to_questions_table', '2025_12_29_add_image_to_questions_table', '7', '7');
INSERT INTO `migrations` VALUES ('31', '31', '2025_12_29_084523_add_points_to_questions_table', '2025_12_29_084523_add_points_to_questions_table', '8', '8');
INSERT INTO `migrations` VALUES ('32', '32', '2025_12_30_033008_add_views_clicks_to_announcements_table', '2025_12_30_033008_add_views_clicks_to_announcements_table', '9', '9');
INSERT INTO `migrations` VALUES ('33', '33', '2025_12_30_033655_add_stats_and_status_to_program_notifications_table', '2025_12_30_033655_add_stats_and_status_to_program_notifications_table', '10', '10');
INSERT INTO `migrations` VALUES ('34', '34', '2025_12_30_034049_create_system_settings_table', '2025_12_30_034049_create_system_settings_table', '11', '11');
INSERT INTO `migrations` VALUES ('35', '35', '2025_12_31_075950_create_user_bookmarks_table', '2025_12_31_075950_create_user_bookmarks_table', '12', '12');
INSERT INTO `migrations` VALUES ('36', '36', '2025_12_31_080433_create_user_progress_table', '2025_12_31_080433_create_user_progress_table', '13', '13');
INSERT INTO `migrations` VALUES ('37', '37', '2025_12_31_080439_create_activity_logs_table', '2025_12_31_080439_create_activity_logs_table', '13', '13');
INSERT INTO `migrations` VALUES ('38', '38', '2025_12_31_080445_create_notifications_table', '2025_12_31_080445_create_notifications_table', '13', '13');
INSERT INTO `migrations` VALUES ('39', '39', '2026_01_05_065417_create_certificates_table', '2026_01_05_065417_create_certificates_table', '14', '14');
INSERT INTO `migrations` VALUES ('40', '40', '2026_01_05_065730_add_certificate_id_to_user_trainings_table', '2026_01_05_065730_add_certificate_id_to_user_trainings_table', '15', '15');
INSERT INTO `migrations` VALUES ('43', '43', '2026_01_05_080155_create_learning_goals_table', '2026_01_05_080155_create_learning_goals_table', '16', '16');
INSERT INTO `migrations` VALUES ('44', '44', '2026_01_06_050441_add_difficulty_rating_to_modules_table', '2026_01_06_050441_add_difficulty_rating_to_modules_table', '16', '16');

CREATE TABLE `password_reset_tokens` (
`email` VARCHAR(255) NOT NULL ,
`token` VARCHAR(255) NOT NULL ,
`created_at` DATETIME NULL 
);


CREATE TABLE `sessions` (
`id` VARCHAR(255) NOT NULL ,
`user_id` INT NULL ,
`ip_address` VARCHAR(255) NULL ,
`user_agent` TEXT NULL ,
`payload` TEXT NOT NULL ,
`last_activity` INT NOT NULL 
);


CREATE TABLE `cache` (
`key` VARCHAR(255) NOT NULL ,
`value` TEXT NOT NULL ,
`expiration` INT NOT NULL 
);


CREATE TABLE `cache_locks` (
`key` VARCHAR(255) NOT NULL ,
`owner` VARCHAR(255) NOT NULL ,
`expiration` INT NOT NULL 
);


CREATE TABLE `jobs` (
`id` INT NOT NULL ,
`queue` VARCHAR(255) NOT NULL ,
`payload` TEXT NOT NULL ,
`attempts` INT NOT NULL ,
`reserved_at` INT NULL ,
`available_at` INT NOT NULL ,
`created_at` INT NOT NULL 
);


CREATE TABLE `job_batches` (
`id` VARCHAR(255) NOT NULL ,
`name` VARCHAR(255) NOT NULL ,
`total_jobs` INT NOT NULL ,
`pending_jobs` INT NOT NULL ,
`failed_jobs` INT NOT NULL ,
`failed_job_ids` TEXT NOT NULL ,
`options` TEXT NULL ,
`cancelled_at` INT NULL ,
`created_at` INT NOT NULL ,
`finished_at` INT NULL 
);


CREATE TABLE `failed_jobs` (
`id` INT NOT NULL ,
`uuid` VARCHAR(255) NOT NULL ,
`connection` TEXT NOT NULL ,
`queue` TEXT NOT NULL ,
`payload` TEXT NOT NULL ,
`exception` TEXT NOT NULL ,
`failed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE `questions` (
`id` INT NOT NULL ,
`module_id` INT NOT NULL ,
`question_text` TEXT NOT NULL ,
`option_a` VARCHAR(255) NOT NULL ,
`option_b` VARCHAR(255) NOT NULL ,
`option_c` VARCHAR(255) NOT NULL ,
`option_d` VARCHAR(255) NOT NULL ,
`correct_answer` VARCHAR(255) NOT NULL ,
`created_at` DATETIME NULL ,
`updated_at` DATETIME NULL ,
`answers` TEXT NULL ,
`difficulty` VARCHAR(255) NOT NULL DEFAULT 'medium',
`explanation` TEXT NULL ,
`question_type` VARCHAR(255) NOT NULL DEFAULT 'multiple_choice',
`image_url` VARCHAR(255) NULL ,
`points` INT NOT NULL DEFAULT '10'
);

INSERT INTO `questions` VALUES ('6', '6', '2', '2', 'Pertanyaan 1 untuk Know Your Customer (KYC)', 'Pertanyaan 1 untuk Know Your Customer (KYC)', 'Pilihan A untuk soal 1', 'Pilihan A untuk soal 1', 'Pilihan B untuk soal 1', 'Pilihan B untuk soal 1', 'Pilihan C untuk soal 1', 'Pilihan C untuk soal 1', 'Pilihan D untuk soal 1', 'Pilihan D untuk soal 1', 'b', 'b', '2025-12-28 17:02:58', '2025-12-28 17:02:58', '2025-12-28 17:02:58', '2025-12-28 17:02:58', '', '', 'medium', 'medium', '', '', 'multiple_choice', 'multiple_choice', '', '', '10', '10');
INSERT INTO `questions` VALUES ('7', '7', '2', '2', 'Pertanyaan 2 untuk Know Your Customer (KYC)', 'Pertanyaan 2 untuk Know Your Customer (KYC)', 'Pilihan A untuk soal 2', 'Pilihan A untuk soal 2', 'Pilihan B untuk soal 2', 'Pilihan B untuk soal 2', 'Pilihan C untuk soal 2', 'Pilihan C untuk soal 2', 'Pilihan D untuk soal 2', 'Pilihan D untuk soal 2', 'c', 'c', '2025-12-28 17:02:58', '2025-12-28 17:02:58', '2025-12-28 17:02:58', '2025-12-28 17:02:58', '', '', 'medium', 'medium', '', '', 'multiple_choice', 'multiple_choice', '', '', '10', '10');
INSERT INTO `questions` VALUES ('8', '8', '2', '2', 'Pertanyaan 3 untuk Know Your Customer (KYC)', 'Pertanyaan 3 untuk Know Your Customer (KYC)', 'Pilihan A untuk soal 3', 'Pilihan A untuk soal 3', 'Pilihan B untuk soal 3', 'Pilihan B untuk soal 3', 'Pilihan C untuk soal 3', 'Pilihan C untuk soal 3', 'Pilihan D untuk soal 3', 'Pilihan D untuk soal 3', 'd', 'd', '2025-12-28 17:02:58', '2025-12-28 17:02:58', '2025-12-28 17:02:58', '2025-12-28 17:02:58', '', '', 'medium', 'medium', '', '', 'multiple_choice', 'multiple_choice', '', '', '10', '10');
INSERT INTO `questions` VALUES ('9', '9', '2', '2', 'Pertanyaan 4 untuk Know Your Customer (KYC)', 'Pertanyaan 4 untuk Know Your Customer (KYC)', 'Pilihan A untuk soal 4', 'Pilihan A untuk soal 4', 'Pilihan B untuk soal 4', 'Pilihan B untuk soal 4', 'Pilihan C untuk soal 4', 'Pilihan C untuk soal 4', 'Pilihan D untuk soal 4', 'Pilihan D untuk soal 4', 'a', 'a', '2025-12-28 17:02:58', '2025-12-28 17:02:58', '2025-12-28 17:02:58', '2025-12-28 17:02:58', '', '', 'medium', 'medium', '', '', 'multiple_choice', 'multiple_choice', '', '', '10', '10');
INSERT INTO `questions` VALUES ('10', '10', '2', '2', 'Pertanyaan 5 untuk Know Your Customer (KYC)', 'Pertanyaan 5 untuk Know Your Customer (KYC)', 'Pilihan A untuk soal 5', 'Pilihan A untuk soal 5', 'Pilihan B untuk soal 5', 'Pilihan B untuk soal 5', 'Pilihan C untuk soal 5', 'Pilihan C untuk soal 5', 'Pilihan D untuk soal 5', 'Pilihan D untuk soal 5', 'b', 'b', '2025-12-28 17:02:58', '2025-12-28 17:02:58', '2025-12-28 17:02:58', '2025-12-28 17:02:58', '', '', 'medium', 'medium', '', '', 'multiple_choice', 'multiple_choice', '', '', '10', '10');
INSERT INTO `questions` VALUES ('16', '16', '4', '4', 'Pertanyaan 1 untuk Keamanan Data dan Cyber', 'Pertanyaan 1 untuk Keamanan Data dan Cyber', 'Pilihan A untuk soal 1', 'Pilihan A untuk soal 1', 'Pilihan B untuk soal 1', 'Pilihan B untuk soal 1', 'Pilihan C untuk soal 1', 'Pilihan C untuk soal 1', 'Pilihan D untuk soal 1', 'Pilihan D untuk soal 1', 'b', 'b', '2025-12-28 17:02:58', '2025-12-28 17:02:58', '2025-12-28 17:02:58', '2025-12-28 17:02:58', '', '', 'medium', 'medium', '', '', 'multiple_choice', 'multiple_choice', '', '', '10', '10');
INSERT INTO `questions` VALUES ('17', '17', '4', '4', 'Pertanyaan 2 untuk Keamanan Data dan Cyber', 'Pertanyaan 2 untuk Keamanan Data dan Cyber', 'Pilihan A untuk soal 2', 'Pilihan A untuk soal 2', 'Pilihan B untuk soal 2', 'Pilihan B untuk soal 2', 'Pilihan C untuk soal 2', 'Pilihan C untuk soal 2', 'Pilihan D untuk soal 2', 'Pilihan D untuk soal 2', 'c', 'c', '2025-12-28 17:02:58', '2025-12-28 17:02:58', '2025-12-28 17:02:58', '2025-12-28 17:02:58', '', '', 'medium', 'medium', '', '', 'multiple_choice', 'multiple_choice', '', '', '10', '10');
INSERT INTO `questions` VALUES ('18', '18', '4', '4', 'Pertanyaan 3 untuk Keamanan Data dan Cyber', 'Pertanyaan 3 untuk Keamanan Data dan Cyber', 'Pilihan A untuk soal 3', 'Pilihan A untuk soal 3', 'Pilihan B untuk soal 3', 'Pilihan B untuk soal 3', 'Pilihan C untuk soal 3', 'Pilihan C untuk soal 3', 'Pilihan D untuk soal 3', 'Pilihan D untuk soal 3', 'd', 'd', '2025-12-28 17:02:58', '2025-12-28 17:02:58', '2025-12-28 17:02:58', '2025-12-28 17:02:58', '', '', 'medium', 'medium', '', '', 'multiple_choice', 'multiple_choice', '', '', '10', '10');
INSERT INTO `questions` VALUES ('19', '19', '4', '4', 'Pertanyaan 4 untuk Keamanan Data dan Cyber', 'Pertanyaan 4 untuk Keamanan Data dan Cyber', 'Pilihan A untuk soal 4', 'Pilihan A untuk soal 4', 'Pilihan B untuk soal 4', 'Pilihan B untuk soal 4', 'Pilihan C untuk soal 4', 'Pilihan C untuk soal 4', 'Pilihan D untuk soal 4', 'Pilihan D untuk soal 4', 'a', 'a', '2025-12-28 17:02:58', '2025-12-28 17:02:58', '2025-12-28 17:02:58', '2025-12-28 17:02:58', '', '', 'medium', 'medium', '', '', 'multiple_choice', 'multiple_choice', '', '', '10', '10');
INSERT INTO `questions` VALUES ('20', '20', '4', '4', 'Pertanyaan 5 untuk Keamanan Data dan Cyber', 'Pertanyaan 5 untuk Keamanan Data dan Cyber', 'Pilihan A untuk soal 5', 'Pilihan A untuk soal 5', 'Pilihan B untuk soal 5', 'Pilihan B untuk soal 5', 'Pilihan C untuk soal 5', 'Pilihan C untuk soal 5', 'Pilihan D untuk soal 5', 'Pilihan D untuk soal 5', 'b', 'b', '2025-12-28 17:02:58', '2025-12-28 17:02:58', '2025-12-28 17:02:58', '2025-12-28 17:02:58', '', '', 'medium', 'medium', '', '', 'multiple_choice', 'multiple_choice', '', '', '10', '10');
INSERT INTO `questions` VALUES ('31', '31', '3', '3', 'Apa tujuan utama dari program pelatihan ini?', 'Apa tujuan utama dari program pelatihan ini?', 'Meningkatkan keterampilan dan pengetahuan peserta', 'Meningkatkan keterampilan dan pengetahuan peserta', 'Hanya untuk mengisi waktu kosong', 'Hanya untuk mengisi waktu kosong', 'Memberikan sertifikat kepada semua peserta', 'Memberikan sertifikat kepada semua peserta', 'Tidak memiliki tujuan khusus', 'Tidak memiliki tujuan khusus', 'a', 'a', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '', '', 'easy', 'easy', 'Tujuan utama pelatihan adalah meningkatkan kompetensi dan pengetahuan peserta di bidang tertentu.', 'Tujuan utama pelatihan adalah meningkatkan kompetensi dan pengetahuan peserta di bidang tertentu.', 'pretest', 'pretest', '', '', '10', '10');
INSERT INTO `questions` VALUES ('32', '32', '3', '3', 'Apa yang Anda ketahui tentang materi yang akan dipelajari?', 'Apa yang Anda ketahui tentang materi yang akan dipelajari?', 'Sangat paham dengan materi', 'Sangat paham dengan materi', 'Cukup paham dengan materi', 'Cukup paham dengan materi', 'Kurang paham dengan materi', 'Kurang paham dengan materi', 'Sama sekali tidak paham', 'Sama sekali tidak paham', 'd', 'd', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '', '', 'easy', 'easy', 'Pretest untuk mengukur tingkat pemahaman awal peserta sebelum mengikuti pelatihan.', 'Pretest untuk mengukur tingkat pemahaman awal peserta sebelum mengikuti pelatihan.', 'pretest', 'pretest', '', '', '10', '10');
INSERT INTO `questions` VALUES ('33', '33', '3', '3', 'Berapa lama durasi program pelatihan ini?', 'Berapa lama durasi program pelatihan ini?', '60 menit', '60 menit', '90 menit', '90 menit', '30 menit', '30 menit', '2 jam', '2 jam', 'a', 'a', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '', '', 'easy', 'easy', 'Durasi program pelatihan ''Manajemen Risiko Operasional'' adalah 60 menit.', 'Durasi program pelatihan ''Manajemen Risiko Operasional'' adalah 60 menit.', 'pretest', 'pretest', '', '', '10', '10');
INSERT INTO `questions` VALUES ('34', '34', '3', '3', 'Berapa nilai minimum yang dibutuhkan untuk lulus program ini?', 'Berapa nilai minimum yang dibutuhkan untuk lulus program ini?', '75%', '75%', '65%', '65%', '85%', '85%', '100%', '100%', 'a', 'a', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '', '', 'easy', 'easy', 'Nilai minimum yang dibutuhkan untuk lulus adalah 75%.', 'Nilai minimum yang dibutuhkan untuk lulus adalah 75%.', 'pretest', 'pretest', '', '', '10', '10');
INSERT INTO `questions` VALUES ('35', '35', '3', '3', 'Apa yang akan Anda lakukan jika menemui kesulitan dalam pelatihan?', 'Apa yang akan Anda lakukan jika menemui kesulitan dalam pelatihan?', 'Berhenti dan tidak melanjutkan', 'Berhenti dan tidak melanjutkan', 'Mencari bantuan dari instruktur atau rekan', 'Mencari bantuan dari instruktur atau rekan', 'Mengabaikan dan lanjut', 'Mengabaikan dan lanjut', 'Keluar dari program', 'Keluar dari program', 'b', 'b', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '', '', 'medium', 'medium', 'Dalam menghadapi kesulitan, peserta harus proaktif mencari bantuan dari instruktur atau rekan kerja.', 'Dalam menghadapi kesulitan, peserta harus proaktif mencari bantuan dari instruktur atau rekan kerja.', 'pretest', 'pretest', '', '', '10', '10');
INSERT INTO `questions` VALUES ('36', '36', '3', '3', 'Apa pembelajaran terpenting yang Anda dapatkan dari program ini?', 'Apa pembelajaran terpenting yang Anda dapatkan dari program ini?', 'Tidak ada pembelajaran sama sekali', 'Tidak ada pembelajaran sama sekali', 'Sedikit pembelajaran yang berguna', 'Sedikit pembelajaran yang berguna', 'Pembelajaran yang sangat bermanfaat dan applicable', 'Pembelajaran yang sangat bermanfaat dan applicable', 'Pembelajaran yang membingungkan', 'Pembelajaran yang membingungkan', 'c', 'c', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '', '', 'medium', 'medium', 'Peserta diharapkan memperoleh pembelajaran yang bermanfaat dan dapat diterapkan dalam pekerjaan sehari-hari.', 'Peserta diharapkan memperoleh pembelajaran yang bermanfaat dan dapat diterapkan dalam pekerjaan sehari-hari.', 'posttest', 'posttest', '', '', '10', '10');
INSERT INTO `questions` VALUES ('37', '37', '3', '3', 'Apakah Anda merasa siap mengimplementasikan pengetahuan yang telah dipelajari?', 'Apakah Anda merasa siap mengimplementasikan pengetahuan yang telah dipelajari?', 'Ya, sangat siap', 'Ya, sangat siap', 'Cukup siap', 'Cukup siap', 'Kurang siap', 'Kurang siap', 'Tidak siap sama sekali', 'Tidak siap sama sekali', 'a', 'a', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '', '', 'medium', 'medium', 'Peserta diharapkan merasa siap untuk menerapkan pengetahuan yang telah dipelajari.', 'Peserta diharapkan merasa siap untuk menerapkan pengetahuan yang telah dipelajari.', 'posttest', 'posttest', '', '', '10', '10');
INSERT INTO `questions` VALUES ('38', '38', '3', '3', 'Bagaimana kualitas materi pelatihan secara keseluruhan?', 'Bagaimana kualitas materi pelatihan secara keseluruhan?', 'Sangat baik dan komprehensif', 'Sangat baik dan komprehensif', 'Baik namun perlu perbaikan', 'Baik namun perlu perbaikan', 'Cukup namun kurang detail', 'Cukup namun kurang detail', 'Kurang memuaskan', 'Kurang memuaskan', 'a', 'a', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '', '', 'medium', 'medium', 'Feedback positif menunjukkan bahwa materi pelatihan telah dirancang dengan baik.', 'Feedback positif menunjukkan bahwa materi pelatihan telah dirancang dengan baik.', 'posttest', 'posttest', '', '', '10', '10');
INSERT INTO `questions` VALUES ('39', '39', '3', '3', 'Apakah Anda akan merekomendasikan program ini kepada orang lain?', 'Apakah Anda akan merekomendasikan program ini kepada orang lain?', 'Ya, sangat recommended', 'Ya, sangat recommended', 'Ya, namun perlu perbaikan', 'Ya, namun perlu perbaikan', 'Mungkin, jika ada perubahan', 'Mungkin, jika ada perubahan', 'Tidak akan merekommasikan', 'Tidak akan merekommasikan', 'a', 'a', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '', '', 'easy', 'easy', 'Program yang baik akan mendapatkan rekomendasi positif dari peserta yang puas.', 'Program yang baik akan mendapatkan rekomendasi positif dari peserta yang puas.', 'posttest', 'posttest', '', '', '10', '10');
INSERT INTO `questions` VALUES ('40', '40', '3', '3', 'Apa saran Anda untuk meningkatkan program ini di masa depan?', 'Apa saran Anda untuk meningkatkan program ini di masa depan?', 'Tingkatkan kualitas materi dan interaktivitas', 'Tingkatkan kualitas materi dan interaktivitas', 'Tambahkan lebih banyak studi kasus praktis', 'Tambahkan lebih banyak studi kasus praktis', 'Sediakan lebih banyak waktu untuk diskusi', 'Sediakan lebih banyak waktu untuk diskusi', 'Semua pilihan di atas relevan', 'Semua pilihan di atas relevan', 'd', 'd', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '', '', 'medium', 'medium', 'Semua masukan dari peserta sangat berharga untuk perbaikan program di masa depan.', 'Semua masukan dari peserta sangat berharga untuk perbaikan program di masa depan.', 'posttest', 'posttest', '', '', '10', '10');
INSERT INTO `questions` VALUES ('41', '41', '5', '5', 'Apa tujuan utama dari program pelatihan ini?', 'Apa tujuan utama dari program pelatihan ini?', 'Meningkatkan keterampilan dan pengetahuan peserta', 'Meningkatkan keterampilan dan pengetahuan peserta', 'Hanya untuk mengisi waktu kosong', 'Hanya untuk mengisi waktu kosong', 'Memberikan sertifikat kepada semua peserta', 'Memberikan sertifikat kepada semua peserta', 'Tidak memiliki tujuan khusus', 'Tidak memiliki tujuan khusus', 'a', 'a', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '', '', 'easy', 'easy', 'Tujuan utama pelatihan adalah meningkatkan kompetensi dan pengetahuan peserta di bidang tertentu.', 'Tujuan utama pelatihan adalah meningkatkan kompetensi dan pengetahuan peserta di bidang tertentu.', 'pretest', 'pretest', '', '', '10', '10');
INSERT INTO `questions` VALUES ('42', '42', '5', '5', 'Apa yang Anda ketahui tentang materi yang akan dipelajari?', 'Apa yang Anda ketahui tentang materi yang akan dipelajari?', 'Sangat paham dengan materi', 'Sangat paham dengan materi', 'Cukup paham dengan materi', 'Cukup paham dengan materi', 'Kurang paham dengan materi', 'Kurang paham dengan materi', 'Sama sekali tidak paham', 'Sama sekali tidak paham', 'd', 'd', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '', '', 'easy', 'easy', 'Pretest untuk mengukur tingkat pemahaman awal peserta sebelum mengikuti pelatihan.', 'Pretest untuk mengukur tingkat pemahaman awal peserta sebelum mengikuti pelatihan.', 'pretest', 'pretest', '', '', '10', '10');
INSERT INTO `questions` VALUES ('43', '43', '5', '5', 'Berapa lama durasi program pelatihan ini?', 'Berapa lama durasi program pelatihan ini?', '120 menit', '120 menit', '150 menit', '150 menit', '90 menit', '90 menit', '2 jam', '2 jam', 'a', 'a', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '', '', 'easy', 'easy', 'Durasi program pelatihan ''Customer Service Excellence'' adalah 120 menit.', 'Durasi program pelatihan ''Customer Service Excellence'' adalah 120 menit.', 'pretest', 'pretest', '', '', '10', '10');
INSERT INTO `questions` VALUES ('44', '44', '5', '5', 'Berapa nilai minimum yang dibutuhkan untuk lulus program ini?', 'Berapa nilai minimum yang dibutuhkan untuk lulus program ini?', '70%', '70%', '60%', '60%', '80%', '80%', '100%', '100%', 'a', 'a', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '', '', 'easy', 'easy', 'Nilai minimum yang dibutuhkan untuk lulus adalah 70%.', 'Nilai minimum yang dibutuhkan untuk lulus adalah 70%.', 'pretest', 'pretest', '', '', '10', '10');
INSERT INTO `questions` VALUES ('45', '45', '5', '5', 'Apa yang akan Anda lakukan jika menemui kesulitan dalam pelatihan?', 'Apa yang akan Anda lakukan jika menemui kesulitan dalam pelatihan?', 'Berhenti dan tidak melanjutkan', 'Berhenti dan tidak melanjutkan', 'Mencari bantuan dari instruktur atau rekan', 'Mencari bantuan dari instruktur atau rekan', 'Mengabaikan dan lanjut', 'Mengabaikan dan lanjut', 'Keluar dari program', 'Keluar dari program', 'b', 'b', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '', '', 'medium', 'medium', 'Dalam menghadapi kesulitan, peserta harus proaktif mencari bantuan dari instruktur atau rekan kerja.', 'Dalam menghadapi kesulitan, peserta harus proaktif mencari bantuan dari instruktur atau rekan kerja.', 'pretest', 'pretest', '', '', '10', '10');
INSERT INTO `questions` VALUES ('46', '46', '5', '5', 'Apa pembelajaran terpenting yang Anda dapatkan dari program ini?', 'Apa pembelajaran terpenting yang Anda dapatkan dari program ini?', 'Tidak ada pembelajaran sama sekali', 'Tidak ada pembelajaran sama sekali', 'Sedikit pembelajaran yang berguna', 'Sedikit pembelajaran yang berguna', 'Pembelajaran yang sangat bermanfaat dan applicable', 'Pembelajaran yang sangat bermanfaat dan applicable', 'Pembelajaran yang membingungkan', 'Pembelajaran yang membingungkan', 'c', 'c', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '', '', 'medium', 'medium', 'Peserta diharapkan memperoleh pembelajaran yang bermanfaat dan dapat diterapkan dalam pekerjaan sehari-hari.', 'Peserta diharapkan memperoleh pembelajaran yang bermanfaat dan dapat diterapkan dalam pekerjaan sehari-hari.', 'posttest', 'posttest', '', '', '10', '10');
INSERT INTO `questions` VALUES ('47', '47', '5', '5', 'Apakah Anda merasa siap mengimplementasikan pengetahuan yang telah dipelajari?', 'Apakah Anda merasa siap mengimplementasikan pengetahuan yang telah dipelajari?', 'Ya, sangat siap', 'Ya, sangat siap', 'Cukup siap', 'Cukup siap', 'Kurang siap', 'Kurang siap', 'Tidak siap sama sekali', 'Tidak siap sama sekali', 'a', 'a', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '', '', 'medium', 'medium', 'Peserta diharapkan merasa siap untuk menerapkan pengetahuan yang telah dipelajari.', 'Peserta diharapkan merasa siap untuk menerapkan pengetahuan yang telah dipelajari.', 'posttest', 'posttest', '', '', '10', '10');
INSERT INTO `questions` VALUES ('48', '48', '5', '5', 'Bagaimana kualitas materi pelatihan secara keseluruhan?', 'Bagaimana kualitas materi pelatihan secara keseluruhan?', 'Sangat baik dan komprehensif', 'Sangat baik dan komprehensif', 'Baik namun perlu perbaikan', 'Baik namun perlu perbaikan', 'Cukup namun kurang detail', 'Cukup namun kurang detail', 'Kurang memuaskan', 'Kurang memuaskan', 'a', 'a', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '', '', 'medium', 'medium', 'Feedback positif menunjukkan bahwa materi pelatihan telah dirancang dengan baik.', 'Feedback positif menunjukkan bahwa materi pelatihan telah dirancang dengan baik.', 'posttest', 'posttest', '', '', '10', '10');
INSERT INTO `questions` VALUES ('49', '49', '5', '5', 'Apakah Anda akan merekomendasikan program ini kepada orang lain?', 'Apakah Anda akan merekomendasikan program ini kepada orang lain?', 'Ya, sangat recommended', 'Ya, sangat recommended', 'Ya, namun perlu perbaikan', 'Ya, namun perlu perbaikan', 'Mungkin, jika ada perubahan', 'Mungkin, jika ada perubahan', 'Tidak akan merekommasikan', 'Tidak akan merekommasikan', 'a', 'a', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '', '', 'easy', 'easy', 'Program yang baik akan mendapatkan rekomendasi positif dari peserta yang puas.', 'Program yang baik akan mendapatkan rekomendasi positif dari peserta yang puas.', 'posttest', 'posttest', '', '', '10', '10');
INSERT INTO `questions` VALUES ('50', '50', '5', '5', 'Apa saran Anda untuk meningkatkan program ini di masa depan?', 'Apa saran Anda untuk meningkatkan program ini di masa depan?', 'Tingkatkan kualitas materi dan interaktivitas', 'Tingkatkan kualitas materi dan interaktivitas', 'Tambahkan lebih banyak studi kasus praktis', 'Tambahkan lebih banyak studi kasus praktis', 'Sediakan lebih banyak waktu untuk diskusi', 'Sediakan lebih banyak waktu untuk diskusi', 'Semua pilihan di atas relevan', 'Semua pilihan di atas relevan', 'd', 'd', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '2025-12-28 18:39:05', '', '', 'medium', 'medium', 'Semua masukan dari peserta sangat berharga untuk perbaikan program di masa depan.', 'Semua masukan dari peserta sangat berharga untuk perbaikan program di masa depan.', 'posttest', 'posttest', '', '', '10', '10');
INSERT INTO `questions` VALUES ('85', '85', '5', '5', 'Apa yang dimaksud dengan Customer Service Excellence?', 'Apa yang dimaksud dengan Customer Service Excellence?', 'Memberikan layanan dengan cepat tanpa memperhatikan kualitas', 'Memberikan layanan dengan cepat tanpa memperhatikan kualitas', 'Memberikan layanan yang melampaui ekspektasi pelanggan dengan konsisten', 'Memberikan layanan yang melampaui ekspektasi pelanggan dengan konsisten', 'Hanya fokus pada penjualan produk', 'Hanya fokus pada penjualan produk', 'Mengikuti prosedur standar tanpa fleksibilitas', 'Mengikuti prosedur standar tanpa fleksibilitas', 'B', 'B', '2026-01-05 03:36:45', '2026-01-05 03:36:45', '2026-01-05 03:36:45', '2026-01-05 03:36:45', '', '', 'easy', 'easy', '', '', 'multiple_choice', 'multiple_choice', '', '', '20', '20');
INSERT INTO `questions` VALUES ('86', '86', '5', '5', 'Manakah yang BUKAN merupakan prinsip dasar customer service yang baik?', 'Manakah yang BUKAN merupakan prinsip dasar customer service yang baik?', 'Empati terhadap pelanggan', 'Empati terhadap pelanggan', 'Responsif terhadap kebutuhan pelanggan', 'Responsif terhadap kebutuhan pelanggan', 'Mengabaikan komplain pelanggan', 'Mengabaikan komplain pelanggan', 'Komunikasi yang efektif', 'Komunikasi yang efektif', 'C', 'C', '2026-01-05 03:36:45', '2026-01-05 03:36:45', '2026-01-05 03:36:45', '2026-01-05 03:36:45', '', '', 'easy', 'easy', '', '', 'multiple_choice', 'multiple_choice', '', '', '20', '20');
INSERT INTO `questions` VALUES ('87', '87', '5', '5', 'Apa yang harus dilakukan pertama kali saat menghadapi pelanggan yang marah?', 'Apa yang harus dilakukan pertama kali saat menghadapi pelanggan yang marah?', 'Membela diri dan menjelaskan kesalahan pelanggan', 'Membela diri dan menjelaskan kesalahan pelanggan', 'Mendengarkan dengan sabar dan berempati', 'Mendengarkan dengan sabar dan berempati', 'Mengalihkan ke departemen lain', 'Mengalihkan ke departemen lain', 'Mengabaikan sampai pelanggan tenang', 'Mengabaikan sampai pelanggan tenang', 'B', 'B', '2026-01-05 03:36:45', '2026-01-05 03:36:45', '2026-01-05 03:36:45', '2026-01-05 03:36:45', '', '', 'medium', 'medium', '', '', 'multiple_choice', 'multiple_choice', '', '', '20', '20');
INSERT INTO `questions` VALUES ('88', '88', '5', '5', 'Apa yang dimaksud dengan "active listening" dalam customer service?', 'Apa yang dimaksud dengan "active listening" dalam customer service?', 'Mendengar sambil melakukan pekerjaan lain', 'Mendengar sambil melakukan pekerjaan lain', 'Mendengarkan dengan penuh perhatian dan memberikan respons yang sesuai', 'Mendengarkan dengan penuh perhatian dan memberikan respons yang sesuai', 'Hanya menunggu giliran berbicara', 'Hanya menunggu giliran berbicara', 'Mendengar tanpa memberikan feedback', 'Mendengar tanpa memberikan feedback', 'B', 'B', '2026-01-05 03:36:45', '2026-01-05 03:36:45', '2026-01-05 03:36:45', '2026-01-05 03:36:45', '', '', 'medium', 'medium', '', '', 'multiple_choice', 'multiple_choice', '', '', '20', '20');
INSERT INTO `questions` VALUES ('89', '89', '5', '5', 'Mengapa follow-up penting dalam customer service?', 'Mengapa follow-up penting dalam customer service?', 'Untuk memastikan kepuasan pelanggan dan menunjukkan komitmen', 'Untuk memastikan kepuasan pelanggan dan menunjukkan komitmen', 'Hanya untuk formalitas', 'Hanya untuk formalitas', 'Tidak penting jika masalah sudah selesai', 'Tidak penting jika masalah sudah selesai', 'Hanya dilakukan jika pelanggan meminta', 'Hanya dilakukan jika pelanggan meminta', 'A', 'A', '2026-01-05 03:36:45', '2026-01-05 03:36:45', '2026-01-05 03:36:45', '2026-01-05 03:36:45', '', '', 'easy', 'easy', '', '', 'multiple_choice', 'multiple_choice', '', '', '20', '20');
INSERT INTO `questions` VALUES ('90', '90', '5', '5', 'Dalam situasi high-pressure dengan banyak pelanggan menunggu, strategi mana yang paling efektif?', 'Dalam situasi high-pressure dengan banyak pelanggan menunggu, strategi mana yang paling efektif?', 'Melayani secepat mungkin tanpa memperhatikan kualitas', 'Melayani secepat mungkin tanpa memperhatikan kualitas', 'Tetap tenang, prioritaskan berdasarkan urgensi, dan komunikasikan waktu tunggu', 'Tetap tenang, prioritaskan berdasarkan urgensi, dan komunikasikan waktu tunggu', 'Fokus pada satu pelanggan dan abaikan yang lain', 'Fokus pada satu pelanggan dan abaikan yang lain', 'Meminta pelanggan untuk datang kembali lain waktu', 'Meminta pelanggan untuk datang kembali lain waktu', 'B', 'B', '2026-01-05 03:36:45', '2026-01-05 03:36:45', '2026-01-05 03:36:45', '2026-01-05 03:36:45', '', '', 'medium', 'medium', '', '', 'multiple_choice', 'multiple_choice', '', '', '20', '20');
INSERT INTO `questions` VALUES ('91', '91', '5', '5', 'Bagaimana cara terbaik menangani komplain pelanggan yang tidak dapat diselesaikan segera?', 'Bagaimana cara terbaik menangani komplain pelanggan yang tidak dapat diselesaikan segera?', 'Memberikan janji palsu agar pelanggan puas sementara', 'Memberikan janji palsu agar pelanggan puas sementara', 'Menyalahkan sistem atau pihak lain', 'Menyalahkan sistem atau pihak lain', 'Komunikasikan transparansi, berikan timeline realistis, dan lakukan follow-up berkala', 'Komunikasikan transparansi, berikan timeline realistis, dan lakukan follow-up berkala', 'Meminta pelanggan untuk bersabar tanpa informasi lebih lanjut', 'Meminta pelanggan untuk bersabar tanpa informasi lebih lanjut', 'C', 'C', '2026-01-05 03:36:45', '2026-01-05 03:36:45', '2026-01-05 03:36:45', '2026-01-05 03:36:45', '', '', 'hard', 'hard', '', '', 'multiple_choice', 'multiple_choice', '', '', '20', '20');
INSERT INTO `questions` VALUES ('92', '92', '5', '5', 'Apa yang membedakan service recovery yang excellent dari yang standar?', 'Apa yang membedakan service recovery yang excellent dari yang standar?', 'Hanya meminta maaf', 'Hanya meminta maaf', 'Proaktif, personalisasi solusi, dan memberikan kompensasi yang sesuai', 'Proaktif, personalisasi solusi, dan memberikan kompensasi yang sesuai', 'Mengikuti prosedur standar tanpa fleksibilitas', 'Mengikuti prosedur standar tanpa fleksibilitas', 'Menunggu pelanggan komplain berkali-kali', 'Menunggu pelanggan komplain berkali-kali', 'B', 'B', '2026-01-05 03:36:45', '2026-01-05 03:36:45', '2026-01-05 03:36:45', '2026-01-05 03:36:45', '', '', 'hard', 'hard', '', '', 'multiple_choice', 'multiple_choice', '', '', '20', '20');
INSERT INTO `questions` VALUES ('93', '93', '5', '5', 'Dalam konteks customer service excellence, apa arti dari "moment of truth"?', 'Dalam konteks customer service excellence, apa arti dari "moment of truth"?', 'Waktu pelanggan membayar', 'Waktu pelanggan membayar', 'Setiap interaksi yang membentuk persepsi pelanggan tentang perusahaan', 'Setiap interaksi yang membentuk persepsi pelanggan tentang perusahaan', 'Hanya saat pertama kali bertemu pelanggan', 'Hanya saat pertama kali bertemu pelanggan', 'Saat memberikan diskon', 'Saat memberikan diskon', 'B', 'B', '2026-01-05 03:36:45', '2026-01-05 03:36:45', '2026-01-05 03:36:45', '2026-01-05 03:36:45', '', '', 'medium', 'medium', '', '', 'multiple_choice', 'multiple_choice', '', '', '20', '20');
INSERT INTO `questions` VALUES ('94', '94', '5', '5', 'Bagaimana cara mengukur keberhasilan customer service excellence?', 'Bagaimana cara mengukur keberhasilan customer service excellence?', 'Hanya dari jumlah pelanggan yang dilayani', 'Hanya dari jumlah pelanggan yang dilayani', 'Customer satisfaction score, retention rate, NPS, dan feedback positif', 'Customer satisfaction score, retention rate, NPS, dan feedback positif', 'Dari kecepatan penyelesaian masalah saja', 'Dari kecepatan penyelesaian masalah saja', 'Hanya dari tidak adanya komplain', 'Hanya dari tidak adanya komplain', 'B', 'B', '2026-01-05 03:36:45', '2026-01-05 03:36:45', '2026-01-05 03:36:45', '2026-01-05 03:36:45', '', '', 'hard', 'hard', '', '', 'multiple_choice', 'multiple_choice', '', '', '20', '20');
INSERT INTO `questions` VALUES ('99', '99', '3', '3', 'Pertanyaan 1 untuk Manajemen Risiko Operasional', 'Pertanyaan 1 untuk Manajemen Risiko Operasional', 'Pilihan A untuk soal 1', 'Pilihan A untuk soal 1', 'Pilihan B untuk soal 1', 'Pilihan B untuk soal 1', 'Pilihan C untuk soal 1', 'Pilihan C untuk soal 1', 'Pilihan D untuk soal 1', 'Pilihan D untuk soal 1', 'b', 'b', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '', '', 'medium', 'medium', '', '', 'multiple_choice', 'multiple_choice', '', '', '10', '10');
INSERT INTO `questions` VALUES ('100', '100', '3', '3', 'Pertanyaan 2 untuk Manajemen Risiko Operasional', 'Pertanyaan 2 untuk Manajemen Risiko Operasional', 'Pilihan A untuk soal 2', 'Pilihan A untuk soal 2', 'Pilihan B untuk soal 2', 'Pilihan B untuk soal 2', 'Pilihan C untuk soal 2', 'Pilihan C untuk soal 2', 'Pilihan D untuk soal 2', 'Pilihan D untuk soal 2', 'c', 'c', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '', '', 'medium', 'medium', '', '', 'multiple_choice', 'multiple_choice', '', '', '10', '10');
INSERT INTO `questions` VALUES ('101', '101', '3', '3', 'Pertanyaan 3 untuk Manajemen Risiko Operasional', 'Pertanyaan 3 untuk Manajemen Risiko Operasional', 'Pilihan A untuk soal 3', 'Pilihan A untuk soal 3', 'Pilihan B untuk soal 3', 'Pilihan B untuk soal 3', 'Pilihan C untuk soal 3', 'Pilihan C untuk soal 3', 'Pilihan D untuk soal 3', 'Pilihan D untuk soal 3', 'd', 'd', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '', '', 'medium', 'medium', '', '', 'multiple_choice', 'multiple_choice', '', '', '10', '10');
INSERT INTO `questions` VALUES ('102', '102', '3', '3', 'Pertanyaan 4 untuk Manajemen Risiko Operasional', 'Pertanyaan 4 untuk Manajemen Risiko Operasional', 'Pilihan A untuk soal 4', 'Pilihan A untuk soal 4', 'Pilihan B untuk soal 4', 'Pilihan B untuk soal 4', 'Pilihan C untuk soal 4', 'Pilihan C untuk soal 4', 'Pilihan D untuk soal 4', 'Pilihan D untuk soal 4', 'a', 'a', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '', '', 'medium', 'medium', '', '', 'multiple_choice', 'multiple_choice', '', '', '10', '10');
INSERT INTO `questions` VALUES ('103', '103', '3', '3', 'Pertanyaan 5 untuk Manajemen Risiko Operasional', 'Pertanyaan 5 untuk Manajemen Risiko Operasional', 'Pilihan A untuk soal 5', 'Pilihan A untuk soal 5', 'Pilihan B untuk soal 5', 'Pilihan B untuk soal 5', 'Pilihan C untuk soal 5', 'Pilihan C untuk soal 5', 'Pilihan D untuk soal 5', 'Pilihan D untuk soal 5', 'b', 'b', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '', '', 'medium', 'medium', '', '', 'multiple_choice', 'multiple_choice', '', '', '10', '10');
INSERT INTO `questions` VALUES ('104', '104', '5', '5', 'Pertanyaan 1 untuk Customer Service Excellence', 'Pertanyaan 1 untuk Customer Service Excellence', 'Pilihan A untuk soal 1', 'Pilihan A untuk soal 1', 'Pilihan B untuk soal 1', 'Pilihan B untuk soal 1', 'Pilihan C untuk soal 1', 'Pilihan C untuk soal 1', 'Pilihan D untuk soal 1', 'Pilihan D untuk soal 1', 'b', 'b', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '', '', 'medium', 'medium', '', '', 'multiple_choice', 'multiple_choice', '', '', '10', '10');
INSERT INTO `questions` VALUES ('105', '105', '5', '5', 'Pertanyaan 2 untuk Customer Service Excellence', 'Pertanyaan 2 untuk Customer Service Excellence', 'Pilihan A untuk soal 2', 'Pilihan A untuk soal 2', 'Pilihan B untuk soal 2', 'Pilihan B untuk soal 2', 'Pilihan C untuk soal 2', 'Pilihan C untuk soal 2', 'Pilihan D untuk soal 2', 'Pilihan D untuk soal 2', 'c', 'c', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '', '', 'medium', 'medium', '', '', 'multiple_choice', 'multiple_choice', '', '', '10', '10');
INSERT INTO `questions` VALUES ('106', '106', '5', '5', 'Pertanyaan 3 untuk Customer Service Excellence', 'Pertanyaan 3 untuk Customer Service Excellence', 'Pilihan A untuk soal 3', 'Pilihan A untuk soal 3', 'Pilihan B untuk soal 3', 'Pilihan B untuk soal 3', 'Pilihan C untuk soal 3', 'Pilihan C untuk soal 3', 'Pilihan D untuk soal 3', 'Pilihan D untuk soal 3', 'd', 'd', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '', '', 'medium', 'medium', '', '', 'multiple_choice', 'multiple_choice', '', '', '10', '10');
INSERT INTO `questions` VALUES ('107', '107', '5', '5', 'Pertanyaan 4 untuk Customer Service Excellence', 'Pertanyaan 4 untuk Customer Service Excellence', 'Pilihan A untuk soal 4', 'Pilihan A untuk soal 4', 'Pilihan B untuk soal 4', 'Pilihan B untuk soal 4', 'Pilihan C untuk soal 4', 'Pilihan C untuk soal 4', 'Pilihan D untuk soal 4', 'Pilihan D untuk soal 4', 'a', 'a', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '', '', 'medium', 'medium', '', '', 'multiple_choice', 'multiple_choice', '', '', '10', '10');
INSERT INTO `questions` VALUES ('108', '108', '5', '5', 'Pertanyaan 5 untuk Customer Service Excellence', 'Pertanyaan 5 untuk Customer Service Excellence', 'Pilihan A untuk soal 5', 'Pilihan A untuk soal 5', 'Pilihan B untuk soal 5', 'Pilihan B untuk soal 5', 'Pilihan C untuk soal 5', 'Pilihan C untuk soal 5', 'Pilihan D untuk soal 5', 'Pilihan D untuk soal 5', 'b', 'b', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '', '', 'medium', 'medium', '', '', 'multiple_choice', 'multiple_choice', '', '', '10', '10');
INSERT INTO `questions` VALUES ('109', '109', '21', '21', 'Pertanyaan 1 untuk Anti Money Laundering (AML)', 'Pertanyaan 1 untuk Anti Money Laundering (AML)', 'Pilihan A untuk soal 1', 'Pilihan A untuk soal 1', 'Pilihan B untuk soal 1', 'Pilihan B untuk soal 1', 'Pilihan C untuk soal 1', 'Pilihan C untuk soal 1', 'Pilihan D untuk soal 1', 'Pilihan D untuk soal 1', 'b', 'b', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '', '', 'medium', 'medium', '', '', 'multiple_choice', 'multiple_choice', '', '', '10', '10');
INSERT INTO `questions` VALUES ('110', '110', '21', '21', 'Pertanyaan 2 untuk Anti Money Laundering (AML)', 'Pertanyaan 2 untuk Anti Money Laundering (AML)', 'Pilihan A untuk soal 2', 'Pilihan A untuk soal 2', 'Pilihan B untuk soal 2', 'Pilihan B untuk soal 2', 'Pilihan C untuk soal 2', 'Pilihan C untuk soal 2', 'Pilihan D untuk soal 2', 'Pilihan D untuk soal 2', 'c', 'c', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '', '', 'medium', 'medium', '', '', 'multiple_choice', 'multiple_choice', '', '', '10', '10');
INSERT INTO `questions` VALUES ('111', '111', '21', '21', 'Pertanyaan 3 untuk Anti Money Laundering (AML)', 'Pertanyaan 3 untuk Anti Money Laundering (AML)', 'Pilihan A untuk soal 3', 'Pilihan A untuk soal 3', 'Pilihan B untuk soal 3', 'Pilihan B untuk soal 3', 'Pilihan C untuk soal 3', 'Pilihan C untuk soal 3', 'Pilihan D untuk soal 3', 'Pilihan D untuk soal 3', 'd', 'd', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '', '', 'medium', 'medium', '', '', 'multiple_choice', 'multiple_choice', '', '', '10', '10');
INSERT INTO `questions` VALUES ('112', '112', '21', '21', 'Pertanyaan 4 untuk Anti Money Laundering (AML)', 'Pertanyaan 4 untuk Anti Money Laundering (AML)', 'Pilihan A untuk soal 4', 'Pilihan A untuk soal 4', 'Pilihan B untuk soal 4', 'Pilihan B untuk soal 4', 'Pilihan C untuk soal 4', 'Pilihan C untuk soal 4', 'Pilihan D untuk soal 4', 'Pilihan D untuk soal 4', 'a', 'a', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '', '', 'medium', 'medium', '', '', 'multiple_choice', 'multiple_choice', '', '', '10', '10');
INSERT INTO `questions` VALUES ('113', '113', '21', '21', 'Pertanyaan 5 untuk Anti Money Laundering (AML)', 'Pertanyaan 5 untuk Anti Money Laundering (AML)', 'Pilihan A untuk soal 5', 'Pilihan A untuk soal 5', 'Pilihan B untuk soal 5', 'Pilihan B untuk soal 5', 'Pilihan C untuk soal 5', 'Pilihan C untuk soal 5', 'Pilihan D untuk soal 5', 'Pilihan D untuk soal 5', 'b', 'b', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '', '', 'medium', 'medium', '', '', 'multiple_choice', 'multiple_choice', '', '', '10', '10');
INSERT INTO `questions` VALUES ('114', '114', '22', '22', 'Pertanyaan 1 untuk Know Your Customer (KYC)', 'Pertanyaan 1 untuk Know Your Customer (KYC)', 'Pilihan A untuk soal 1', 'Pilihan A untuk soal 1', 'Pilihan B untuk soal 1', 'Pilihan B untuk soal 1', 'Pilihan C untuk soal 1', 'Pilihan C untuk soal 1', 'Pilihan D untuk soal 1', 'Pilihan D untuk soal 1', 'b', 'b', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '', '', 'medium', 'medium', '', '', 'multiple_choice', 'multiple_choice', '', '', '10', '10');
INSERT INTO `questions` VALUES ('115', '115', '22', '22', 'Pertanyaan 2 untuk Know Your Customer (KYC)', 'Pertanyaan 2 untuk Know Your Customer (KYC)', 'Pilihan A untuk soal 2', 'Pilihan A untuk soal 2', 'Pilihan B untuk soal 2', 'Pilihan B untuk soal 2', 'Pilihan C untuk soal 2', 'Pilihan C untuk soal 2', 'Pilihan D untuk soal 2', 'Pilihan D untuk soal 2', 'c', 'c', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '', '', 'medium', 'medium', '', '', 'multiple_choice', 'multiple_choice', '', '', '10', '10');
INSERT INTO `questions` VALUES ('116', '116', '22', '22', 'Pertanyaan 3 untuk Know Your Customer (KYC)', 'Pertanyaan 3 untuk Know Your Customer (KYC)', 'Pilihan A untuk soal 3', 'Pilihan A untuk soal 3', 'Pilihan B untuk soal 3', 'Pilihan B untuk soal 3', 'Pilihan C untuk soal 3', 'Pilihan C untuk soal 3', 'Pilihan D untuk soal 3', 'Pilihan D untuk soal 3', 'd', 'd', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '', '', 'medium', 'medium', '', '', 'multiple_choice', 'multiple_choice', '', '', '10', '10');
INSERT INTO `questions` VALUES ('117', '117', '22', '22', 'Pertanyaan 4 untuk Know Your Customer (KYC)', 'Pertanyaan 4 untuk Know Your Customer (KYC)', 'Pilihan A untuk soal 4', 'Pilihan A untuk soal 4', 'Pilihan B untuk soal 4', 'Pilihan B untuk soal 4', 'Pilihan C untuk soal 4', 'Pilihan C untuk soal 4', 'Pilihan D untuk soal 4', 'Pilihan D untuk soal 4', 'a', 'a', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '', '', 'medium', 'medium', '', '', 'multiple_choice', 'multiple_choice', '', '', '10', '10');
INSERT INTO `questions` VALUES ('118', '118', '22', '22', 'Pertanyaan 5 untuk Know Your Customer (KYC)', 'Pertanyaan 5 untuk Know Your Customer (KYC)', 'Pilihan A untuk soal 5', 'Pilihan A untuk soal 5', 'Pilihan B untuk soal 5', 'Pilihan B untuk soal 5', 'Pilihan C untuk soal 5', 'Pilihan C untuk soal 5', 'Pilihan D untuk soal 5', 'Pilihan D untuk soal 5', 'b', 'b', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '', '', 'medium', 'medium', '', '', 'multiple_choice', 'multiple_choice', '', '', '10', '10');
INSERT INTO `questions` VALUES ('119', '119', '23', '23', 'Pertanyaan 1 untuk Keamanan Data dan Cyber', 'Pertanyaan 1 untuk Keamanan Data dan Cyber', 'Pilihan A untuk soal 1', 'Pilihan A untuk soal 1', 'Pilihan B untuk soal 1', 'Pilihan B untuk soal 1', 'Pilihan C untuk soal 1', 'Pilihan C untuk soal 1', 'Pilihan D untuk soal 1', 'Pilihan D untuk soal 1', 'b', 'b', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '', '', 'medium', 'medium', '', '', 'multiple_choice', 'multiple_choice', '', '', '10', '10');
INSERT INTO `questions` VALUES ('120', '120', '23', '23', 'Pertanyaan 2 untuk Keamanan Data dan Cyber', 'Pertanyaan 2 untuk Keamanan Data dan Cyber', 'Pilihan A untuk soal 2', 'Pilihan A untuk soal 2', 'Pilihan B untuk soal 2', 'Pilihan B untuk soal 2', 'Pilihan C untuk soal 2', 'Pilihan C untuk soal 2', 'Pilihan D untuk soal 2', 'Pilihan D untuk soal 2', 'c', 'c', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '', '', 'medium', 'medium', '', '', 'multiple_choice', 'multiple_choice', '', '', '10', '10');
INSERT INTO `questions` VALUES ('121', '121', '23', '23', 'Pertanyaan 3 untuk Keamanan Data dan Cyber', 'Pertanyaan 3 untuk Keamanan Data dan Cyber', 'Pilihan A untuk soal 3', 'Pilihan A untuk soal 3', 'Pilihan B untuk soal 3', 'Pilihan B untuk soal 3', 'Pilihan C untuk soal 3', 'Pilihan C untuk soal 3', 'Pilihan D untuk soal 3', 'Pilihan D untuk soal 3', 'd', 'd', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '', '', 'medium', 'medium', '', '', 'multiple_choice', 'multiple_choice', '', '', '10', '10');
INSERT INTO `questions` VALUES ('122', '122', '23', '23', 'Pertanyaan 4 untuk Keamanan Data dan Cyber', 'Pertanyaan 4 untuk Keamanan Data dan Cyber', 'Pilihan A untuk soal 4', 'Pilihan A untuk soal 4', 'Pilihan B untuk soal 4', 'Pilihan B untuk soal 4', 'Pilihan C untuk soal 4', 'Pilihan C untuk soal 4', 'Pilihan D untuk soal 4', 'Pilihan D untuk soal 4', 'a', 'a', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '', '', 'medium', 'medium', '', '', 'multiple_choice', 'multiple_choice', '', '', '10', '10');
INSERT INTO `questions` VALUES ('123', '123', '23', '23', 'Pertanyaan 5 untuk Keamanan Data dan Cyber', 'Pertanyaan 5 untuk Keamanan Data dan Cyber', 'Pilihan A untuk soal 5', 'Pilihan A untuk soal 5', 'Pilihan B untuk soal 5', 'Pilihan B untuk soal 5', 'Pilihan C untuk soal 5', 'Pilihan C untuk soal 5', 'Pilihan D untuk soal 5', 'Pilihan D untuk soal 5', 'b', 'b', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '', '', 'medium', 'medium', '', '', 'multiple_choice', 'multiple_choice', '', '', '10', '10');

CREATE TABLE `module_progress` (
`id` INT NOT NULL ,
`user_id` INT NOT NULL ,
`module_id` INT NOT NULL ,
`status` VARCHAR(255) NOT NULL DEFAULT 'locked',
`progress_percentage` NUMERIC NOT NULL DEFAULT '0',
`last_accessed_at` DATETIME NULL ,
`created_at` DATETIME NULL ,
`updated_at` DATETIME NULL 
);

INSERT INTO `module_progress` VALUES ('1', '1', '3', '3', '1', '1', 'completed', 'completed', '100', '100', '2025-12-23 17:02:58', '2025-12-23 17:02:58', '2025-12-28 17:02:58', '2025-12-28 17:02:58', '2025-12-28 17:02:58', '2025-12-28 17:02:58');
INSERT INTO `module_progress` VALUES ('2', '2', '3', '3', '2', '2', 'in_progress', 'in_progress', '60', '60', '2025-12-24 17:02:58', '2025-12-24 17:02:58', '2025-12-28 17:02:58', '2025-12-28 17:02:58', '2025-12-28 17:02:58', '2025-12-28 17:02:58');
INSERT INTO `module_progress` VALUES ('3', '3', '3', '3', '3', '3', 'completed', 'completed', '100', '100', '2026-01-02 04:19:50', '2026-01-02 04:19:50', '2025-12-28 17:02:58', '2025-12-28 17:02:58', '2026-01-07 04:19:50', '2026-01-07 04:19:50');
INSERT INTO `module_progress` VALUES ('4', '4', '4', '4', '1', '1', 'in_progress', 'in_progress', '45', '45', '2025-12-28 15:02:58', '2025-12-28 15:02:58', '2025-12-28 17:02:58', '2025-12-28 17:02:58', '2025-12-28 17:02:58', '2025-12-28 17:02:58');
INSERT INTO `module_progress` VALUES ('5', '5', '4', '4', '2', '2', 'in_progress', 'in_progress', '45', '45', '2025-12-28 15:02:58', '2025-12-28 15:02:58', '2025-12-28 17:02:58', '2025-12-28 17:02:58', '2025-12-28 17:02:58', '2025-12-28 17:02:58');
INSERT INTO `module_progress` VALUES ('6', '6', '3', '3', '5', '5', 'in_progress', 'in_progress', '60', '60', '2026-01-03 04:19:50', '2026-01-03 04:19:50', '2026-01-05 04:38:52', '2026-01-05 04:38:52', '2026-01-07 04:19:50', '2026-01-07 04:19:50');
INSERT INTO `module_progress` VALUES ('7', '7', '21', '21', '5', '5', 'completed', 'completed', '100', '100', '2026-01-07 01:59:45', '2026-01-07 01:59:45', '2026-01-07 01:59:45', '2026-01-07 01:59:45', '2026-01-07 01:59:45', '2026-01-07 01:59:45');
INSERT INTO `module_progress` VALUES ('8', '8', '21', '21', '19', '19', 'completed', 'completed', '100', '100', '2026-01-07 03:22:00', '2026-01-07 03:22:00', '2026-01-07 03:22:00', '2026-01-07 03:22:00', '2026-01-07 03:22:00', '2026-01-07 03:22:00');
INSERT INTO `module_progress` VALUES ('9', '9', '21', '21', '3', '3', 'completed', 'completed', '100', '100', '2026-01-07 03:30:51', '2026-01-07 03:30:51', '2026-01-07 03:30:51', '2026-01-07 03:30:51', '2026-01-07 03:30:51', '2026-01-07 03:30:51');
INSERT INTO `module_progress` VALUES ('10', '10', '3', '3', '21', '21', 'locked', 'locked', '0', '0', '2026-01-04 04:19:50', '2026-01-04 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50');
INSERT INTO `module_progress` VALUES ('11', '11', '4', '4', '3', '3', 'in_progress', 'in_progress', '45', '45', '2026-01-07 02:19:51', '2026-01-07 02:19:51', '2026-01-07 04:19:51', '2026-01-07 04:19:51', '2026-01-07 04:19:51', '2026-01-07 04:19:51');
INSERT INTO `module_progress` VALUES ('12', '12', '4', '4', '5', '5', 'in_progress', 'in_progress', '45', '45', '2026-01-07 02:19:51', '2026-01-07 02:19:51', '2026-01-07 04:19:51', '2026-01-07 04:19:51', '2026-01-07 04:19:51', '2026-01-07 04:19:51');

CREATE TABLE `exam_attempts` (
`id` INT NOT NULL ,
`user_id` INT NOT NULL ,
`module_id` INT NOT NULL ,
`exam_type` VARCHAR(255) NOT NULL ,
`score` INT NOT NULL ,
`percentage` NUMERIC NOT NULL ,
`is_passed` TINYINT(1) NOT NULL DEFAULT '0',
`started_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
`finished_at` DATETIME NULL ,
`duration_minutes` INT NULL ,
`created_at` DATETIME NULL ,
`updated_at` DATETIME NULL 
);

INSERT INTO `exam_attempts` VALUES ('3', '3', '3', '3', '5', '5', 'post_test', 'post_test', '80', '80', '80', '80', '1', '1', '2026-01-05 03:47:40', '2026-01-05 03:47:40', '2026-01-05 03:50:51', '2026-01-05 03:50:51', '-3.1956947166667', '-3.1956947166667', '2026-01-05 03:47:40', '2026-01-05 03:47:40', '2026-01-05 04:58:12', '2026-01-05 04:58:12');
INSERT INTO `exam_attempts` VALUES ('4', '4', '3', '3', '5', '5', 'pre_test', 'pre_test', '80', '80', '80', '80', '1', '1', '2026-01-05 04:43:12', '2026-01-05 04:43:12', '', '', '', '', '2026-01-05 04:58:12', '2026-01-05 04:58:12', '2026-01-05 04:58:12', '2026-01-05 04:58:12');
INSERT INTO `exam_attempts` VALUES ('5', '5', '3', '3', '5', '5', 'post_test', 'post_test', '20', '20', '40', '40', '0', '0', '2026-01-05 04:59:32', '2026-01-05 04:59:32', '2026-01-05 06:39:43', '2026-01-05 06:39:43', '-100.18504606667', '-100.18504606667', '2026-01-05 04:59:32', '2026-01-05 04:59:32', '2026-01-05 06:39:43', '2026-01-05 06:39:43');
INSERT INTO `exam_attempts` VALUES ('6', '6', '3', '3', '5', '5', 'post_test', 'post_test', '0', '0', '0', '0', '0', '0', '2026-01-05 06:39:44', '2026-01-05 06:39:44', '2026-01-05 07:04:31', '2026-01-05 07:04:31', '-24.796957783333', '-24.796957783333', '2026-01-05 06:39:44', '2026-01-05 06:39:44', '2026-01-05 07:04:31', '2026-01-05 07:04:31');
INSERT INTO `exam_attempts` VALUES ('7', '7', '3', '3', '5', '5', 'post_test', 'post_test', '30', '30', '42.86', '42.86', '0', '0', '2026-01-05 07:16:15', '2026-01-05 07:16:15', '2026-01-05 07:17:04', '2026-01-05 07:17:04', '-0.83192746666667', '-0.83192746666667', '2026-01-05 07:16:15', '2026-01-05 07:16:15', '2026-01-05 07:17:04', '2026-01-05 07:17:04');
INSERT INTO `exam_attempts` VALUES ('8', '8', '3', '3', '5', '5', 'post_test', 'post_test', '0', '0', '0', '0', '0', '0', '2026-01-05 07:18:01', '2026-01-05 07:18:01', '2026-01-05 07:18:18', '2026-01-05 07:18:18', '-0.28808053333333', '-0.28808053333333', '2026-01-05 07:18:01', '2026-01-05 07:18:01', '2026-01-05 07:18:18', '2026-01-05 07:18:18');
INSERT INTO `exam_attempts` VALUES ('9', '9', '3', '3', '5', '5', 'post_test', 'post_test', '70', '70', '100', '100', '1', '1', '2026-01-05 07:18:45', '2026-01-05 07:18:45', '2026-01-05 07:19:26', '2026-01-05 07:19:26', '-0.69650793333333', '-0.69650793333333', '2026-01-05 07:18:45', '2026-01-05 07:18:45', '2026-01-05 07:19:26', '2026-01-05 07:19:26');
INSERT INTO `exam_attempts` VALUES ('10', '10', '21', '21', '5', '5', 'pre_test', 'pre_test', '40', '40', '57.14', '57.14', '0', '0', '2026-01-06 11:27:39', '2026-01-06 11:27:39', '2026-01-07 01:53:50', '2026-01-07 01:53:50', '-866.18407103333', '-866.18407103333', '2026-01-06 11:27:39', '2026-01-06 11:27:39', '2026-01-07 01:53:50', '2026-01-07 01:53:50');
INSERT INTO `exam_attempts` VALUES ('11', '11', '21', '21', '5', '5', 'post_test', 'post_test', '10', '10', '16.67', '16.67', '0', '0', '2026-01-07 01:57:59', '2026-01-07 01:57:59', '2026-01-07 01:58:22', '2026-01-07 01:58:22', '-0.39882076666667', '-0.39882076666667', '2026-01-07 01:57:59', '2026-01-07 01:57:59', '2026-01-07 01:58:22', '2026-01-07 01:58:22');
INSERT INTO `exam_attempts` VALUES ('12', '12', '21', '21', '5', '5', 'post_test', 'post_test', '20', '20', '33.33', '33.33', '0', '0', '2026-01-07 01:58:27', '2026-01-07 01:58:27', '2026-01-07 01:58:47', '2026-01-07 01:58:47', '-0.34122873333333', '-0.34122873333333', '2026-01-07 01:58:27', '2026-01-07 01:58:27', '2026-01-07 01:58:47', '2026-01-07 01:58:47');
INSERT INTO `exam_attempts` VALUES ('13', '13', '3', '3', '3', '3', 'post_test', 'post_test', '85', '85', '85', '85', '1', '1', '2026-01-02 14:00:00', '2026-01-02 14:00:00', '2026-01-02 14:20:00', '2026-01-02 14:20:00', '20', '20', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50');

CREATE TABLE `user_exam_answers` (
`id` INT NOT NULL ,
`exam_attempt_id` INT NOT NULL ,
`user_id` INT NOT NULL ,
`question_id` INT NOT NULL ,
`user_answer` VARCHAR(255) NOT NULL ,
`correct_answer` VARCHAR(255) NOT NULL ,
`is_correct` TINYINT(1) NOT NULL DEFAULT '0',
`created_at` DATETIME NULL ,
`updated_at` DATETIME NULL 
);

INSERT INTO `user_exam_answers` VALUES ('1', '1', '3', '3', '3', '3', '41', '41', 'A', 'A', 'A', 'A', '1', '1', '2026-01-05 03:50:51', '2026-01-05 03:50:51', '2026-01-05 03:50:51', '2026-01-05 03:50:51');
INSERT INTO `user_exam_answers` VALUES ('2', '2', '3', '3', '3', '3', '91', '91', 'B', 'B', 'C', 'C', '0', '0', '2026-01-05 03:50:51', '2026-01-05 03:50:51', '2026-01-05 03:50:51', '2026-01-05 03:50:51');
INSERT INTO `user_exam_answers` VALUES ('3', '3', '3', '3', '3', '3', '48', '48', 'C', 'C', 'A', 'A', '0', '0', '2026-01-05 03:50:51', '2026-01-05 03:50:51', '2026-01-05 03:50:51', '2026-01-05 03:50:51');
INSERT INTO `user_exam_answers` VALUES ('4', '4', '3', '3', '3', '3', '86', '86', 'B', 'B', 'C', 'C', '0', '0', '2026-01-05 03:50:51', '2026-01-05 03:50:51', '2026-01-05 03:50:51', '2026-01-05 03:50:51');
INSERT INTO `user_exam_answers` VALUES ('5', '5', '3', '3', '3', '3', '89', '89', 'D', 'D', 'A', 'A', '0', '0', '2026-01-05 03:50:51', '2026-01-05 03:50:51', '2026-01-05 03:50:51', '2026-01-05 03:50:51');
INSERT INTO `user_exam_answers` VALUES ('6', '6', '5', '5', '3', '3', '47', '47', 'C', 'C', 'A', 'A', '0', '0', '2026-01-05 06:39:43', '2026-01-05 06:39:43', '2026-01-05 06:39:43', '2026-01-05 06:39:43');
INSERT INTO `user_exam_answers` VALUES ('7', '7', '5', '5', '3', '3', '45', '45', 'B', 'B', 'B', 'B', '1', '1', '2026-01-05 06:39:43', '2026-01-05 06:39:43', '2026-01-05 06:39:43', '2026-01-05 06:39:43');
INSERT INTO `user_exam_answers` VALUES ('8', '8', '5', '5', '3', '3', '44', '44', 'A', 'A', 'A', 'A', '1', '1', '2026-01-05 06:39:43', '2026-01-05 06:39:43', '2026-01-05 06:39:43', '2026-01-05 06:39:43');
INSERT INTO `user_exam_answers` VALUES ('9', '9', '5', '5', '3', '3', '42', '42', 'B', 'B', 'D', 'D', '0', '0', '2026-01-05 06:39:43', '2026-01-05 06:39:43', '2026-01-05 06:39:43', '2026-01-05 06:39:43');
INSERT INTO `user_exam_answers` VALUES ('10', '10', '5', '5', '3', '3', '43', '43', 'C', 'C', 'A', 'A', '0', '0', '2026-01-05 06:39:43', '2026-01-05 06:39:43', '2026-01-05 06:39:43', '2026-01-05 06:39:43');
INSERT INTO `user_exam_answers` VALUES ('11', '11', '6', '6', '3', '3', '43', '43', 'B', 'B', 'A', 'A', '0', '0', '2026-01-05 07:04:31', '2026-01-05 07:04:31', '2026-01-05 07:04:31', '2026-01-05 07:04:31');
INSERT INTO `user_exam_answers` VALUES ('12', '12', '6', '6', '3', '3', '41', '41', 'C', 'C', 'A', 'A', '0', '0', '2026-01-05 07:04:31', '2026-01-05 07:04:31', '2026-01-05 07:04:31', '2026-01-05 07:04:31');
INSERT INTO `user_exam_answers` VALUES ('13', '13', '6', '6', '3', '3', '49', '49', 'C', 'C', 'A', 'A', '0', '0', '2026-01-05 07:04:31', '2026-01-05 07:04:31', '2026-01-05 07:04:31', '2026-01-05 07:04:31');
INSERT INTO `user_exam_answers` VALUES ('14', '14', '6', '6', '3', '3', '87', '87', 'D', 'D', 'B', 'B', '0', '0', '2026-01-05 07:04:31', '2026-01-05 07:04:31', '2026-01-05 07:04:31', '2026-01-05 07:04:31');
INSERT INTO `user_exam_answers` VALUES ('15', '15', '7', '7', '3', '3', '90', '90', 'C', 'C', 'B', 'B', '0', '0', '2026-01-05 07:16:45', '2026-01-05 07:16:45', '2026-01-05 07:16:45', '2026-01-05 07:16:45');
INSERT INTO `user_exam_answers` VALUES ('16', '16', '7', '7', '3', '3', '86', '86', 'D', 'D', 'C', 'C', '0', '0', '2026-01-05 07:16:45', '2026-01-05 07:16:45', '2026-01-05 07:16:45', '2026-01-05 07:16:45');
INSERT INTO `user_exam_answers` VALUES ('17', '17', '7', '7', '3', '3', '87', '87', 'B', 'B', 'B', 'B', '1', '1', '2026-01-05 07:16:45', '2026-01-05 07:16:45', '2026-01-05 07:16:45', '2026-01-05 07:16:45');
INSERT INTO `user_exam_answers` VALUES ('18', '18', '7', '7', '3', '3', '50', '50', 'D', 'D', 'D', 'D', '1', '1', '2026-01-05 07:16:45', '2026-01-05 07:16:45', '2026-01-05 07:16:45', '2026-01-05 07:16:45');
INSERT INTO `user_exam_answers` VALUES ('19', '19', '7', '7', '3', '3', '90', '90', 'C', 'C', 'B', 'B', '0', '0', '2026-01-05 07:17:04', '2026-01-05 07:17:04', '2026-01-05 07:17:04', '2026-01-05 07:17:04');
INSERT INTO `user_exam_answers` VALUES ('20', '20', '7', '7', '3', '3', '86', '86', 'D', 'D', 'C', 'C', '0', '0', '2026-01-05 07:17:04', '2026-01-05 07:17:04', '2026-01-05 07:17:04', '2026-01-05 07:17:04');
INSERT INTO `user_exam_answers` VALUES ('21', '21', '7', '7', '3', '3', '87', '87', 'B', 'B', 'B', 'B', '1', '1', '2026-01-05 07:17:04', '2026-01-05 07:17:04', '2026-01-05 07:17:04', '2026-01-05 07:17:04');
INSERT INTO `user_exam_answers` VALUES ('22', '22', '7', '7', '3', '3', '50', '50', 'D', 'D', 'D', 'D', '1', '1', '2026-01-05 07:17:04', '2026-01-05 07:17:04', '2026-01-05 07:17:04', '2026-01-05 07:17:04');
INSERT INTO `user_exam_answers` VALUES ('23', '23', '8', '8', '3', '3', '88', '88', 'A', 'A', 'B', 'B', '0', '0', '2026-01-05 07:18:18', '2026-01-05 07:18:18', '2026-01-05 07:18:18', '2026-01-05 07:18:18');
INSERT INTO `user_exam_answers` VALUES ('24', '24', '8', '8', '3', '3', '50', '50', 'B', 'B', 'D', 'D', '0', '0', '2026-01-05 07:18:18', '2026-01-05 07:18:18', '2026-01-05 07:18:18', '2026-01-05 07:18:18');
INSERT INTO `user_exam_answers` VALUES ('25', '25', '8', '8', '3', '3', '94', '94', 'D', 'D', 'B', 'B', '0', '0', '2026-01-05 07:18:18', '2026-01-05 07:18:18', '2026-01-05 07:18:18', '2026-01-05 07:18:18');
INSERT INTO `user_exam_answers` VALUES ('26', '26', '8', '8', '3', '3', '44', '44', 'C', 'C', 'A', 'A', '0', '0', '2026-01-05 07:18:18', '2026-01-05 07:18:18', '2026-01-05 07:18:18', '2026-01-05 07:18:18');
INSERT INTO `user_exam_answers` VALUES ('27', '27', '8', '8', '3', '3', '92', '92', 'C', 'C', 'B', 'B', '0', '0', '2026-01-05 07:18:18', '2026-01-05 07:18:18', '2026-01-05 07:18:18', '2026-01-05 07:18:18');
INSERT INTO `user_exam_answers` VALUES ('28', '28', '9', '9', '3', '3', '44', '44', 'A', 'A', 'A', 'A', '1', '1', '2026-01-05 07:19:26', '2026-01-05 07:19:26', '2026-01-05 07:19:26', '2026-01-05 07:19:26');
INSERT INTO `user_exam_answers` VALUES ('29', '29', '9', '9', '3', '3', '45', '45', 'B', 'B', 'B', 'B', '1', '1', '2026-01-05 07:19:26', '2026-01-05 07:19:26', '2026-01-05 07:19:26', '2026-01-05 07:19:26');
INSERT INTO `user_exam_answers` VALUES ('30', '30', '9', '9', '3', '3', '90', '90', 'B', 'B', 'B', 'B', '1', '1', '2026-01-05 07:19:26', '2026-01-05 07:19:26', '2026-01-05 07:19:26', '2026-01-05 07:19:26');
INSERT INTO `user_exam_answers` VALUES ('31', '31', '9', '9', '3', '3', '48', '48', 'A', 'A', 'A', 'A', '1', '1', '2026-01-05 07:19:26', '2026-01-05 07:19:26', '2026-01-05 07:19:26', '2026-01-05 07:19:26');
INSERT INTO `user_exam_answers` VALUES ('32', '32', '9', '9', '3', '3', '92', '92', 'B', 'B', 'B', 'B', '1', '1', '2026-01-05 07:19:26', '2026-01-05 07:19:26', '2026-01-05 07:19:26', '2026-01-05 07:19:26');
INSERT INTO `user_exam_answers` VALUES ('33', '33', '10', '10', '21', '21', '47', '47', 'A', 'A', 'A', 'A', '1', '1', '2026-01-07 01:53:50', '2026-01-07 01:53:50', '2026-01-07 01:53:50', '2026-01-07 01:53:50');
INSERT INTO `user_exam_answers` VALUES ('34', '34', '10', '10', '21', '21', '93', '93', 'B', 'B', 'B', 'B', '1', '1', '2026-01-07 01:53:50', '2026-01-07 01:53:50', '2026-01-07 01:53:50', '2026-01-07 01:53:50');
INSERT INTO `user_exam_answers` VALUES ('35', '35', '10', '10', '21', '21', '89', '89', 'B', 'B', 'A', 'A', '0', '0', '2026-01-07 01:53:50', '2026-01-07 01:53:50', '2026-01-07 01:53:50', '2026-01-07 01:53:50');
INSERT INTO `user_exam_answers` VALUES ('36', '36', '10', '10', '21', '21', '50', '50', 'C', 'C', 'D', 'D', '0', '0', '2026-01-07 01:53:50', '2026-01-07 01:53:50', '2026-01-07 01:53:50', '2026-01-07 01:53:50');
INSERT INTO `user_exam_answers` VALUES ('37', '37', '10', '10', '21', '21', '42', '42', 'D', 'D', 'D', 'D', '1', '1', '2026-01-07 01:53:50', '2026-01-07 01:53:50', '2026-01-07 01:53:50', '2026-01-07 01:53:50');
INSERT INTO `user_exam_answers` VALUES ('38', '38', '11', '11', '21', '21', '47', '47', 'A', 'A', 'A', 'A', '1', '1', '2026-01-07 01:58:22', '2026-01-07 01:58:22', '2026-01-07 01:58:22', '2026-01-07 01:58:22');
INSERT INTO `user_exam_answers` VALUES ('39', '39', '11', '11', '21', '21', '43', '43', 'C', 'C', 'A', 'A', '0', '0', '2026-01-07 01:58:22', '2026-01-07 01:58:22', '2026-01-07 01:58:22', '2026-01-07 01:58:22');
INSERT INTO `user_exam_answers` VALUES ('40', '40', '11', '11', '21', '21', '46', '46', 'B', 'B', 'C', 'C', '0', '0', '2026-01-07 01:58:22', '2026-01-07 01:58:22', '2026-01-07 01:58:22', '2026-01-07 01:58:22');
INSERT INTO `user_exam_answers` VALUES ('41', '41', '11', '11', '21', '21', '41', '41', 'C', 'C', 'A', 'A', '0', '0', '2026-01-07 01:58:22', '2026-01-07 01:58:22', '2026-01-07 01:58:22', '2026-01-07 01:58:22');
INSERT INTO `user_exam_answers` VALUES ('42', '42', '11', '11', '21', '21', '94', '94', 'D', 'D', 'B', 'B', '0', '0', '2026-01-07 01:58:22', '2026-01-07 01:58:22', '2026-01-07 01:58:22', '2026-01-07 01:58:22');
INSERT INTO `user_exam_answers` VALUES ('43', '43', '12', '12', '21', '21', '47', '47', 'A', 'A', 'A', 'A', '1', '1', '2026-01-07 01:58:47', '2026-01-07 01:58:47', '2026-01-07 01:58:47', '2026-01-07 01:58:47');
INSERT INTO `user_exam_answers` VALUES ('44', '44', '12', '12', '21', '21', '44', '44', 'B', 'B', 'A', 'A', '0', '0', '2026-01-07 01:58:47', '2026-01-07 01:58:47', '2026-01-07 01:58:47', '2026-01-07 01:58:47');
INSERT INTO `user_exam_answers` VALUES ('45', '45', '12', '12', '21', '21', '48', '48', 'C', 'C', 'A', 'A', '0', '0', '2026-01-07 01:58:47', '2026-01-07 01:58:47', '2026-01-07 01:58:47', '2026-01-07 01:58:47');
INSERT INTO `user_exam_answers` VALUES ('46', '46', '12', '12', '21', '21', '50', '50', 'D', 'D', 'D', 'D', '1', '1', '2026-01-07 01:58:47', '2026-01-07 01:58:47', '2026-01-07 01:58:47', '2026-01-07 01:58:47');
INSERT INTO `user_exam_answers` VALUES ('47', '47', '12', '12', '21', '21', '94', '94', 'D', 'D', 'B', 'B', '0', '0', '2026-01-07 01:58:47', '2026-01-07 01:58:47', '2026-01-07 01:58:47', '2026-01-07 01:58:47');

CREATE TABLE `user_trainings` (
`id` INT NOT NULL ,
`user_id` INT NOT NULL ,
`module_id` INT NOT NULL ,
`status` VARCHAR(255) NOT NULL DEFAULT 'enrolled',
`final_score` INT NULL ,
`is_certified` TINYINT(1) NOT NULL DEFAULT '0',
`enrolled_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
`completed_at` DATETIME NULL ,
`created_at` DATETIME NULL ,
`updated_at` DATETIME NULL ,
`certificate_id` INT NULL 
);

INSERT INTO `user_trainings` VALUES ('38', '38', '21', '21', '5', '5', 'completed', 'completed', '33.33', '33.33', '0', '0', '2026-01-06 10:28:29', '2026-01-06 10:28:29', '2026-01-07 01:59:45', '2026-01-07 01:59:45', '2026-01-06 10:28:29', '2026-01-06 10:28:29', '2026-01-07 01:59:45', '2026-01-07 01:59:45', '2', '2');
INSERT INTO `user_trainings` VALUES ('39', '39', '21', '21', '3', '3', 'completed', 'completed', '', '', '0', '0', '2026-01-06 10:38:54', '2026-01-06 10:38:54', '2026-01-07 03:30:51', '2026-01-07 03:30:51', '2026-01-06 10:38:54', '2026-01-06 10:38:54', '2026-01-07 03:30:51', '2026-01-07 03:30:51', '', '');
INSERT INTO `user_trainings` VALUES ('40', '40', '3', '3', '5', '5', 'in_progress', 'in_progress', '', '', '0', '0', '2025-12-29 04:19:50', '2025-12-29 04:19:50', '', '', '2026-01-06 10:42:51', '2026-01-06 10:42:51', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '', '');
INSERT INTO `user_trainings` VALUES ('43', '43', '7', '7', '3', '3', 'enrolled', 'enrolled', '', '', '0', '0', '2026-01-07 04:00:37', '2026-01-07 04:00:37', '', '', '2026-01-07 04:00:37', '2026-01-07 04:00:37', '2026-01-07 04:00:37', '2026-01-07 04:00:37', '', '');
INSERT INTO `user_trainings` VALUES ('44', '44', '3', '3', '3', '3', 'completed', 'completed', '85', '85', '1', '1', '2025-12-28 04:19:50', '2025-12-28 04:19:50', '2026-01-02 04:19:50', '2026-01-02 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '', '');
INSERT INTO `user_trainings` VALUES ('45', '45', '3', '3', '21', '21', 'enrolled', 'enrolled', '', '', '0', '0', '2025-12-30 04:19:50', '2025-12-30 04:19:50', '', '', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '', '');
INSERT INTO `user_trainings` VALUES ('46', '46', '4', '4', '3', '3', 'in_progress', 'in_progress', '', '', '0', '0', '2026-01-04 04:19:50', '2026-01-04 04:19:50', '', '', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '', '');
INSERT INTO `user_trainings` VALUES ('47', '47', '4', '4', '5', '5', 'in_progress', 'in_progress', '', '', '0', '0', '2026-01-04 04:19:51', '2026-01-04 04:19:51', '', '', '2026-01-07 04:19:51', '2026-01-07 04:19:51', '2026-01-07 04:19:51', '2026-01-07 04:19:51', '', '');

CREATE TABLE `audit_logs` (
`id` INT NOT NULL ,
`user_id` INT NOT NULL ,
`action` VARCHAR(255) NOT NULL ,
`entity_type` VARCHAR(255) NULL ,
`entity_id` INT NULL ,
`changes` TEXT NULL ,
`ip_address` VARCHAR(255) NULL ,
`logged_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO `audit_logs` VALUES ('1', '1', '1', '1', 'send_reminder', 'send_reminder', '', '', '', '', '"{\"reminded_user\":\"Test User\",\"reminded_email\":\"test@example.com\",\"module\":\"Manajemen Risiko Operasional\"}"', '"{\"reminded_user\":\"Test User\",\"reminded_email\":\"test@example.com\",\"module\":\"Manajemen Risiko Operasional\"}"', '', '', '2025-12-28 18:21:31', '2025-12-28 18:21:31');
INSERT INTO `audit_logs` VALUES ('2', '2', '1', '1', 'send_reminder', 'send_reminder', 'Module', 'Module', '3', '3', '{"reminded_user":"Test User","reminded_email":"test@example.com","module":"Manajemen Risiko Operasional"}', '{"reminded_user":"Test User","reminded_email":"test@example.com","module":"Manajemen Risiko Operasional"}', '', '', '2025-12-28 18:22:21', '2025-12-28 18:22:21');

CREATE TABLE `quizzes` (
`id` INT NOT NULL ,
`title` VARCHAR(255) NULL ,
`name` VARCHAR(255) NOT NULL ,
`type` VARCHAR(255) NOT NULL DEFAULT 'posttest',
`description` TEXT NULL ,
`passing_score` INT NOT NULL DEFAULT '60',
`time_limit` INT NULL ,
`show_answers` TINYINT(1) NOT NULL DEFAULT '1',
`is_active` TINYINT(1) NOT NULL DEFAULT '1',
`difficulty` VARCHAR(255) NOT NULL DEFAULT 'medium',
`question_count` INT NOT NULL DEFAULT '0',
`status` VARCHAR(255) NOT NULL DEFAULT 'published',
`quality_score` INT NOT NULL DEFAULT '0',
`coverage_score` INT NOT NULL DEFAULT '0',
`module_id` INT NULL ,
`training_program_id` INT NULL ,
`created_by` INT NULL ,
`published_by` INT NULL ,
`published_at` DATETIME NULL ,
`created_at` DATETIME NULL ,
`updated_at` DATETIME NULL 
);

INSERT INTO `quizzes` VALUES ('1', '1', 'Pretest Customer Service Excellence', 'Pretest Customer Service Excellence', 'Pretest - Customer Service Excellence', 'Pretest - Customer Service Excellence', 'pretest', 'pretest', 'Tes awal untuk mengukur pemahaman dasar tentang customer service excellence', 'Tes awal untuk mengukur pemahaman dasar tentang customer service excellence', '60', '60', '15', '15', '1', '1', '1', '1', 'medium', 'medium', '5', '5', 'published', 'published', '85', '85', '80', '80', '5', '5', '', '', '', '', '', '', '', '', '2026-01-05 03:36:45', '2026-01-05 03:36:45', '2026-01-05 03:36:45', '2026-01-05 03:36:45');
INSERT INTO `quizzes` VALUES ('2', '2', 'Posttest Customer Service Excellence', 'Posttest Customer Service Excellence', 'Posttest - Customer Service Excellence', 'Posttest - Customer Service Excellence', 'posttest', 'posttest', 'Tes akhir untuk mengukur pemahaman setelah mengikuti training customer service excellence', 'Tes akhir untuk mengukur pemahaman setelah mengikuti training customer service excellence', '70', '70', '20', '20', '1', '1', '1', '1', 'medium', 'medium', '5', '5', 'published', 'published', '90', '90', '85', '85', '5', '5', '', '', '', '', '', '', '', '', '2026-01-05 03:36:45', '2026-01-05 03:36:45', '2026-01-05 03:36:45', '2026-01-05 03:36:45');

CREATE TABLE `content_uploads` (
`id` INT NOT NULL ,
`title` VARCHAR(255) NOT NULL ,
`description` TEXT NULL ,
`file_path` VARCHAR(255) NOT NULL ,
`original_filename` VARCHAR(255) NOT NULL ,
`file_type` VARCHAR(255) NOT NULL ,
`file_size` INT NOT NULL ,
`status` VARCHAR(255) NOT NULL DEFAULT 'pending',
`progress` INT NOT NULL DEFAULT '0',
`conversion_type` VARCHAR(255) NULL ,
`conversion_details` TEXT NULL ,
`conversion_completed_at` DATETIME NULL ,
`error_message` TEXT NULL ,
`created_by` INT NOT NULL ,
`created_at` DATETIME NULL ,
`updated_at` DATETIME NULL 
);


CREATE TABLE `reminders` (
`id` INT NOT NULL ,
`title` VARCHAR(255) NOT NULL ,
`message` TEXT NOT NULL ,
`recipient_count` INT NOT NULL DEFAULT '0',
`sent_count` INT NOT NULL DEFAULT '0',
`opened_count` INT NOT NULL DEFAULT '0',
`status` VARCHAR(255) NOT NULL DEFAULT 'draft',
`scheduled_at` DATETIME NULL ,
`sent_at` DATETIME NULL ,
`department_id` INT NULL ,
`created_by` INT NOT NULL ,
`created_at` DATETIME NULL ,
`updated_at` DATETIME NULL 
);


CREATE TABLE `reminder_user` (
`id` INT NOT NULL ,
`reminder_id` INT NOT NULL ,
`user_id` INT NOT NULL ,
`opened_at` DATETIME NULL ,
`created_at` DATETIME NULL ,
`updated_at` DATETIME NULL 
);


CREATE TABLE `program_approvals` (
`id` INT NOT NULL ,
`module_id` INT NOT NULL ,
`status` VARCHAR(255) NOT NULL DEFAULT 'pending',
`requested_by` INT NOT NULL ,
`reviewed_by` INT NULL ,
`request_notes` TEXT NULL ,
`reviewer_notes` TEXT NULL ,
`requested_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
`reviewed_at` DATETIME NULL ,
`created_at` DATETIME NULL ,
`updated_at` DATETIME NULL 
);


CREATE TABLE `compliance_evidences` (
`id` INT NOT NULL ,
`module_id` INT NOT NULL ,
`user_id` INT NOT NULL ,
`evidence_type` VARCHAR(255) NOT NULL ,
`file_path` VARCHAR(255) NULL ,
`description` TEXT NULL ,
`status` VARCHAR(255) NOT NULL DEFAULT 'pending',
`verified_at` DATETIME NULL ,
`verified_by` INT NULL ,
`verification_notes` TEXT NULL ,
`created_at` DATETIME NULL ,
`updated_at` DATETIME NULL 
);


CREATE TABLE `program_templates` (
`id` INT NOT NULL ,
`name` VARCHAR(255) NOT NULL ,
`description` TEXT NULL ,
`category` VARCHAR(255) NOT NULL ,
`structure` TEXT NOT NULL ,
`questions_template` TEXT NULL ,
`created_by` INT NOT NULL ,
`is_active` TINYINT(1) NOT NULL DEFAULT '1',
`usage_count` INT NOT NULL DEFAULT '0',
`created_at` DATETIME NULL ,
`updated_at` DATETIME NULL 
);


CREATE TABLE `program_enrollment_metrics` (
`id` INT NOT NULL ,
`module_id` INT NOT NULL ,
`metric_date` DATE NOT NULL ,
`total_enrolled` INT NOT NULL DEFAULT '0',
`completed` INT NOT NULL DEFAULT '0',
`in_progress` INT NOT NULL DEFAULT '0',
`not_started` INT NOT NULL DEFAULT '0',
`average_score` NUMERIC NOT NULL DEFAULT '0',
`created_at` DATETIME NULL ,
`updated_at` DATETIME NULL 
);


CREATE TABLE `modules` (
`id` INT NOT NULL ,
`title` VARCHAR(255) NOT NULL ,
`description` TEXT NULL ,
`video_url` VARCHAR(255) NULL ,
`document_url` VARCHAR(255) NULL ,
`presentation_url` VARCHAR(255) NULL ,
`passing_grade` INT NOT NULL DEFAULT '70',
`has_pretest` TINYINT(1) NOT NULL DEFAULT '0',
`is_active` TINYINT(1) NOT NULL DEFAULT '1',
`created_at` DATETIME NULL ,
`updated_at` DATETIME NULL ,
`approval_status` VARCHAR(255) NOT NULL DEFAULT 'draft',
`approved_at` DATETIME NULL ,
`approved_by` INT NULL ,
`compliance_required` TINYINT(1) NOT NULL DEFAULT '0',
`start_date` DATE NULL ,
`end_date` DATE NULL ,
`instructor_id` INT NULL ,
`template_id` INT NULL ,
`expiry_date` DATE NULL ,
`prerequisite_module_id` INT NULL ,
`target_departments` TEXT NULL ,
`duration_minutes` INT NOT NULL DEFAULT '60',
`allow_retake` TINYINT(1) NOT NULL DEFAULT '1',
`max_retake_attempts` INT NOT NULL DEFAULT '3',
`category` VARCHAR(255) NULL ,
`certificate_template` TEXT NULL ,
`cover_image` VARCHAR(255) NULL ,
`xp` INT NOT NULL DEFAULT '0',
`has_posttest` TINYINT(1) NOT NULL DEFAULT '0',
`difficulty` VARCHAR(255) NOT NULL DEFAULT 'intermediate',
`rating` NUMERIC NOT NULL DEFAULT '4.5'
);

INSERT INTO `modules` VALUES ('3', '3', 'Manajemen Risiko Operasional', 'Manajemen Risiko Operasional', 'Pelatihan tentang identifikasi, penilaian, dan mitigasi risiko operasional.', 'Pelatihan tentang identifikasi, penilaian, dan mitigasi risiko operasional.', '', '', '', '', '', '', '75', '75', '0', '0', '1', '1', '2025-12-28 17:02:58', '2025-12-28 17:02:58', '2026-01-06 06:56:21', '2026-01-06 06:56:21', 'approved', 'approved', '', '', '', '', '0', '0', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '60', '60', '1', '1', '3', '3', 'compliance', 'compliance', '', '', '', '', '0', '0', '0', '0', 'intermediate', 'intermediate', '4.5', '4.5');
INSERT INTO `modules` VALUES ('5', '5', 'Customer Service Excellence', 'Customer Service Excellence', 'Pelatihan soft skill tentang layanan pelanggan yang excellent.', 'Pelatihan soft skill tentang layanan pelanggan yang excellent.', '/materials/5/video-training.html', '/materials/5/video-training.html', '/materials/5/dokumen-pembelajaran.html', '/materials/5/dokumen-pembelajaran.html', '/materials/5/presentasi.html', '/materials/5/presentasi.html', '70', '70', '0', '0', '1', '1', '2025-12-28 17:02:58', '2025-12-28 17:02:58', '2026-01-06 06:56:21', '2026-01-06 06:56:21', 'approved', 'approved', '', '', '', '', '0', '0', '', '', '', '', '', '', '', '', '2026-01-02 00:00:00', '2026-01-02 00:00:00', '', '', '', '', '120', '120', '1', '1', '3', '3', 'compliance', 'compliance', '', '', '', '', '0', '0', '0', '0', 'intermediate', 'intermediate', '4.5', '4.5');
INSERT INTO `modules` VALUES ('21', '21', 'Anti Money Laundering (AML)', 'Anti Money Laundering (AML)', 'Program pelatihan compliance tentang pencegahan pencucian uang sesuai regulasi OJK.', 'Program pelatihan compliance tentang pencegahan pencucian uang sesuai regulasi OJK.', '', '', '', '', '', '', '75', '75', '1', '1', '1', '1', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', 'draft', 'draft', '', '', '', '', '0', '0', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '60', '60', '1', '1', '3', '3', '', '', '', '', '', '', '0', '0', '0', '0', 'intermediate', 'intermediate', '4.5', '4.5');
INSERT INTO `modules` VALUES ('22', '22', 'Know Your Customer (KYC)', 'Know Your Customer (KYC)', 'Pelatihan identifikasi dan verifikasi customer untuk compliance.', 'Pelatihan identifikasi dan verifikasi customer untuk compliance.', '', '', '', '', '', '', '70', '70', '1', '1', '1', '1', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', 'draft', 'draft', '', '', '', '', '0', '0', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '60', '60', '1', '1', '3', '3', '', '', '', '', '', '', '0', '0', '0', '0', 'intermediate', 'intermediate', '4.5', '4.5');
INSERT INTO `modules` VALUES ('23', '23', 'Keamanan Data dan Cyber', 'Keamanan Data dan Cyber', 'Program pelatihan tentang security awareness dan best practice keamanan data.', 'Program pelatihan tentang security awareness dan best practice keamanan data.', '', '', '', '', '', '', '80', '80', '1', '1', '1', '1', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '2026-01-07 04:19:50', 'draft', 'draft', '', '', '', '', '0', '0', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '60', '60', '1', '1', '3', '3', '', '', '', '', '', '', '0', '0', '0', '0', 'intermediate', 'intermediate', '4.5', '4.5');

CREATE TABLE `question_banks` (
`id` INT NOT NULL ,
`name` VARCHAR(255) NOT NULL ,
`description` TEXT NULL ,
`created_by` INT NOT NULL ,
`created_at` DATETIME NULL ,
`updated_at` DATETIME NULL 
);


CREATE TABLE `question_bank_questions` (
`id` INT NOT NULL ,
`question_bank_id` INT NOT NULL ,
`question_id` INT NOT NULL ,
`created_at` DATETIME NULL ,
`updated_at` DATETIME NULL 
);


CREATE TABLE `training_materials` (
`id` INT NOT NULL ,
`module_id` INT NOT NULL ,
`title` VARCHAR(255) NOT NULL ,
`description` TEXT NULL ,
`file_type` VARCHAR(255) NOT NULL ,
`file_path` VARCHAR(255) NOT NULL ,
`file_name` VARCHAR(255) NOT NULL ,
`file_size` INT NOT NULL ,
`duration_minutes` INT NOT NULL DEFAULT '0',
`order` INT NOT NULL DEFAULT '0',
`version` INT NOT NULL DEFAULT '1',
`uploaded_by` INT NOT NULL ,
`created_at` DATETIME NULL ,
`updated_at` DATETIME NULL ,
`pdf_path` VARCHAR(255) NULL 
);

INSERT INTO `training_materials` VALUES ('16', '16', '3', '3', 'Pengenalan Manajemen Risiko', 'Pengenalan Manajemen Risiko', 'Dokumen pengenalan tentang manajemen risiko operasional di perusahaan', 'Dokumen pengenalan tentang manajemen risiko operasional di perusahaan', 'pdf', 'pdf', '/materials/risiko-intro.pdf', '/materials/risiko-intro.pdf', 'risiko-intro.pdf', 'risiko-intro.pdf', '1024000', '1024000', '15', '15', '1', '1', '1', '1', '1', '1', '2026-01-05 07:28:36', '2026-01-05 07:28:36', '2026-01-05 07:28:36', '2026-01-05 07:28:36', '', '');
INSERT INTO `training_materials` VALUES ('17', '17', '3', '3', 'Video: Identifikasi Risiko', 'Video: Identifikasi Risiko', 'Video tutorial cara mengidentifikasi risiko dalam proses operasional', 'Video tutorial cara mengidentifikasi risiko dalam proses operasional', 'video', 'video', '/materials/identifikasi-risiko.mp4', '/materials/identifikasi-risiko.mp4', 'identifikasi-risiko.mp4', 'identifikasi-risiko.mp4', '50000000', '50000000', '20', '20', '2', '2', '1', '1', '1', '1', '2026-01-05 07:28:36', '2026-01-05 07:28:36', '2026-01-05 07:28:36', '2026-01-05 07:28:36', '', '');
INSERT INTO `training_materials` VALUES ('18', '18', '5', '5', 'Panduan Customer Service', 'Panduan Customer Service', 'Panduan lengkap tentang customer service excellence', 'Panduan lengkap tentang customer service excellence', 'pdf', 'pdf', '/materials/cs-guide.pdf', '/materials/cs-guide.pdf', 'cs-guide.pdf', 'cs-guide.pdf', '2048000', '2048000', '30', '30', '1', '1', '1', '1', '1', '1', '2026-01-05 07:28:36', '2026-01-05 07:28:36', '2026-01-05 07:28:36', '2026-01-05 07:28:36', '', '');
INSERT INTO `training_materials` VALUES ('19', '19', '5', '5', 'Video: Handling Complaints', 'Video: Handling Complaints', 'Video tutorial menangani keluhan pelanggan dengan baik', 'Video tutorial menangani keluhan pelanggan dengan baik', 'video', 'video', '/materials/handling-complaints.mp4', '/materials/handling-complaints.mp4', 'handling-complaints.mp4', 'handling-complaints.mp4', '75000000', '75000000', '25', '25', '2', '2', '1', '1', '1', '1', '2026-01-05 07:28:36', '2026-01-05 07:28:36', '2026-01-05 07:28:36', '2026-01-05 07:28:36', '', '');

CREATE TABLE `module_assignments` (
`id` INT NOT NULL ,
`module_id` INT NOT NULL ,
`user_id` INT NULL ,
`department` VARCHAR(255) NULL ,
`assigned_date` DATE NOT NULL ,
`due_date` DATE NULL ,
`status` VARCHAR(255) NOT NULL DEFAULT 'pending',
`created_at` DATETIME NULL ,
`updated_at` DATETIME NULL ,
`priority` VARCHAR(255) NOT NULL DEFAULT 'normal'
);

INSERT INTO `module_assignments` VALUES ('38', '38', '5', '5', '21', '21', '', '', '2026-01-06 10:28:29', '2026-01-06 10:28:29', '', '', 'pending', 'pending', '2026-01-06 10:28:29', '2026-01-06 10:28:29', '2026-01-06 10:28:29', '2026-01-06 10:28:29', 'normal', 'normal');
INSERT INTO `module_assignments` VALUES ('39', '39', '3', '3', '21', '21', '', '', '2026-01-06 10:38:54', '2026-01-06 10:38:54', '', '', 'pending', 'pending', '2026-01-06 10:38:54', '2026-01-06 10:38:54', '2026-01-06 10:38:54', '2026-01-06 10:38:54', 'normal', 'normal');
INSERT INTO `module_assignments` VALUES ('40', '40', '5', '5', '3', '3', '', '', '2026-01-06 10:42:51', '2026-01-06 10:42:51', '', '', 'pending', 'pending', '2026-01-06 10:42:51', '2026-01-06 10:42:51', '2026-01-06 10:42:51', '2026-01-06 10:42:51', 'normal', 'normal');
INSERT INTO `module_assignments` VALUES ('43', '43', '3', '3', '7', '7', '', '', '2026-01-07 04:00:37', '2026-01-07 04:00:37', '', '', 'pending', 'pending', '2026-01-07 04:00:37', '2026-01-07 04:00:37', '2026-01-07 04:00:37', '2026-01-07 04:00:37', 'normal', 'normal');

CREATE TABLE `training_discussions` (
`id` INT NOT NULL ,
`module_id` INT NOT NULL ,
`user_id` INT NOT NULL ,
`question` TEXT NOT NULL ,
`answer` TEXT NULL ,
`answered_by` INT NULL ,
`helpful_count` INT NOT NULL DEFAULT '0',
`is_pinned` TINYINT(1) NOT NULL DEFAULT '0',
`created_at` DATETIME NULL ,
`updated_at` DATETIME NULL 
);


CREATE TABLE `roles` (
`id` INT NOT NULL ,
`name` VARCHAR(255) NOT NULL ,
`description` TEXT NULL ,
`is_active` TINYINT(1) NOT NULL DEFAULT '1',
`created_at` DATETIME NULL ,
`updated_at` DATETIME NULL 
);


CREATE TABLE `permissions` (
`id` INT NOT NULL ,
`name` VARCHAR(255) NOT NULL ,
`slug` VARCHAR(255) NOT NULL ,
`description` TEXT NULL ,
`category` VARCHAR(255) NULL ,
`is_active` TINYINT(1) NOT NULL DEFAULT '1',
`created_at` DATETIME NULL ,
`updated_at` DATETIME NULL 
);


CREATE TABLE `role_permissions` (
`id` INT NOT NULL ,
`role_id` INT NOT NULL ,
`permission_id` INT NOT NULL ,
`created_at` DATETIME NULL ,
`updated_at` DATETIME NULL 
);


CREATE TABLE `departments` (
`id` INT NOT NULL ,
`name` VARCHAR(255) NOT NULL ,
`code` VARCHAR(255) NULL ,
`description` TEXT NULL ,
`head_id` INT NULL ,
`is_active` TINYINT(1) NOT NULL DEFAULT '1',
`created_at` DATETIME NULL ,
`updated_at` DATETIME NULL 
);


CREATE TABLE `user_roles` (
`id` INT NOT NULL ,
`user_id` INT NOT NULL ,
`role_id` INT NOT NULL ,
`created_at` DATETIME NULL ,
`updated_at` DATETIME NULL 
);


CREATE TABLE `users` (
`id` INT NOT NULL ,
`name` VARCHAR(255) NOT NULL ,
`email` VARCHAR(255) NOT NULL ,
`email_verified_at` DATETIME NULL ,
`password` VARCHAR(255) NOT NULL ,
`remember_token` VARCHAR(255) NULL ,
`created_at` DATETIME NULL ,
`updated_at` DATETIME NULL ,
`nip` VARCHAR(255) NULL ,
`role` VARCHAR(255) NOT NULL DEFAULT 'user',
`status` VARCHAR(255) NOT NULL DEFAULT 'active',
`department` VARCHAR(255) NULL ,
`last_login_at` DATETIME NULL ,
`phone` VARCHAR(255) NULL ,
`department_id` INT NULL 
);

INSERT INTO `users` VALUES ('1', '1', 'Admin BNI', 'Admin BNI', 'admin@bni.co.id', 'admin@bni.co.id', '2026-01-07 04:19:49', '2026-01-07 04:19:49', '$2y$12$/9HeGZS53yd0i62GDX.t8.9Zs2ilJcrRFps90X9FiKkbnEUqgpPD2', '$2y$12$/9HeGZS53yd0i62GDX.t8.9Zs2ilJcrRFps90X9FiKkbnEUqgpPD2', 'V8qyFks8NZyEwJGzGW9FOQ6nDXb4eFZqi7iG3HROiKAPmAjuSjDfXYMY7dbM', 'V8qyFks8NZyEwJGzGW9FOQ6nDXb4eFZqi7iG3HROiKAPmAjuSjDfXYMY7dbM', '2025-12-28 17:02:55', '2025-12-28 17:02:55', '2026-01-07 04:19:49', '2026-01-07 04:19:49', '999999', '999999', 'admin', 'admin', 'active', 'active', 'Management', 'Management', '', '', '', '', '', '');
INSERT INTO `users` VALUES ('2', '2', 'Test User', 'Test User', 'test@example.com', 'test@example.com', '2026-01-07 04:19:49', '2026-01-07 04:19:49', '$2y$12$hVsIDSCo0RUWams.UN9AyuHJNGMFxe1Kmh4edRZbch8KyhsBDzU.e', '$2y$12$hVsIDSCo0RUWams.UN9AyuHJNGMFxe1Kmh4edRZbch8KyhsBDzU.e', 'P9FooJmMlz', 'P9FooJmMlz', '2025-12-28 17:02:56', '2025-12-28 17:02:56', '2026-01-07 04:19:49', '2026-01-07 04:19:49', '', '', 'user', 'user', 'active', 'active', '', '', '', '', '', '', '', '');
INSERT INTO `users` VALUES ('3', '3', 'Budi Santoso', 'Budi Santoso', 'budi.santoso@bni.co.id', 'budi.santoso@bni.co.id', '', '', '$2y$12$b7VvTxMcRNcwPm7TBADvseS96RKMsBroPlgIFbjuEnd3x790qrhbu', '$2y$12$b7VvTxMcRNcwPm7TBADvseS96RKMsBroPlgIFbjuEnd3x790qrhbu', '', '', '2025-12-28 17:02:57', '2025-12-28 17:02:57', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '11111110001', '11111110001', 'user', 'user', 'active', 'active', 'Divisi Kepatuhan', 'Divisi Kepatuhan', '', '', '081234567801', '081234567801', '', '');
INSERT INTO `users` VALUES ('4', '4', 'Siti Nurhaliza', 'Siti Nurhaliza', 'siti.nurhaliza@bni.co.id', 'siti.nurhaliza@bni.co.id', '', '', '$2y$12$b2GfS27NoW89ZcSrjCUoEOVGF8rg9/inwKTJC9EAL71OAmooAtYDq', '$2y$12$b2GfS27NoW89ZcSrjCUoEOVGF8rg9/inwKTJC9EAL71OAmooAtYDq', '', '', '2025-12-28 17:02:57', '2025-12-28 17:02:57', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '11111110002', '11111110002', 'user', 'user', 'active', 'active', 'Divisi Risiko', 'Divisi Risiko', '', '', '081234567802', '081234567802', '', '');
INSERT INTO `users` VALUES ('5', '5', 'Admin Training', 'Admin Training', 'admin.training@bni.co.id', 'admin.training@bni.co.id', '', '', '$2y$12$.3cu1AbuvHlBaG2MnWHdKeOUk2jOAYo2w1a7.CcOkH1PwcgmVtd0m', '$2y$12$.3cu1AbuvHlBaG2MnWHdKeOUk2jOAYo2w1a7.CcOkH1PwcgmVtd0m', '', '', '2025-12-28 17:02:58', '2025-12-28 17:02:58', '2026-01-07 04:19:50', '2026-01-07 04:19:50', '11111110003', '11111110003', 'admin', 'admin', 'active', 'active', 'HC & Training', 'HC & Training', '', '', '', '', '', '');
INSERT INTO `users` VALUES ('6', '6', 'Ahmad Fauzi', 'Ahmad Fauzi', 'ahmad.fauzi@bni.co.id', 'ahmad.fauzi@bni.co.id', '', '', '$2y$12$f/Z3JTlib81/pFjCwUSPTuHgRm2Jh3amH0QvTlmNH2hyKg8XqqiLq', '$2y$12$f/Z3JTlib81/pFjCwUSPTuHgRm2Jh3amH0QvTlmNH2hyKg8XqqiLq', '', '', '2025-12-30 02:51:26', '2025-12-30 02:51:26', '2026-01-07 04:19:36', '2026-01-07 04:19:36', '1003', '1003', 'user', 'user', 'active', 'active', 'Finance', 'Finance', '', '', '081234567803', '081234567803', '', '');
INSERT INTO `users` VALUES ('7', '7', 'Dewi Lestari', 'Dewi Lestari', 'dewi.lestari@bni.co.id', 'dewi.lestari@bni.co.id', '', '', '$2y$12$wPJJgEfr8QNvalj5kmSeIeaiqeEjb10.FyEEHTrCQ2.AutJIiDTQq', '$2y$12$wPJJgEfr8QNvalj5kmSeIeaiqeEjb10.FyEEHTrCQ2.AutJIiDTQq', '', '', '2025-12-30 02:51:26', '2025-12-30 02:51:26', '2026-01-07 04:19:36', '2026-01-07 04:19:36', '1004', '1004', 'user', 'user', 'active', 'active', 'Marketing', 'Marketing', '', '', '081234567804', '081234567804', '', '');
INSERT INTO `users` VALUES ('8', '8', 'Rudi Hartono', 'Rudi Hartono', 'rudi.hartono@bni.co.id', 'rudi.hartono@bni.co.id', '', '', '$2y$12$QH2a7CuJvKOGcvYqfUHGpegZJzd6IpOktjv0cRw3rqScyxGn9AxbC', '$2y$12$QH2a7CuJvKOGcvYqfUHGpegZJzd6IpOktjv0cRw3rqScyxGn9AxbC', '', '', '2025-12-30 02:51:26', '2025-12-30 02:51:26', '2026-01-07 04:19:36', '2026-01-07 04:19:36', '1005', '1005', 'user', 'user', 'active', 'active', 'Operations', 'Operations', '', '', '081234567805', '081234567805', '', '');
INSERT INTO `users` VALUES ('9', '9', 'Maya Putri', 'Maya Putri', 'maya.putri@bni.co.id', 'maya.putri@bni.co.id', '', '', '$2y$12$0TTe1b.mpHOvH..QQpwgXu4KCusgFIh0W9RI6GuRGROWpVX4w3HtO', '$2y$12$0TTe1b.mpHOvH..QQpwgXu4KCusgFIh0W9RI6GuRGROWpVX4w3HtO', '', '', '2025-12-30 02:51:26', '2025-12-30 02:51:26', '2026-01-07 04:19:36', '2026-01-07 04:19:36', '1006', '1006', 'user', 'user', 'active', 'active', 'Legal', 'Legal', '', '', '081234567806', '081234567806', '', '');
INSERT INTO `users` VALUES ('10', '10', 'Eko Prasetyo', 'Eko Prasetyo', 'eko.prasetyo@bni.co.id', 'eko.prasetyo@bni.co.id', '', '', '$2y$12$QVETcMqTtOedrsgiOHFPsu.gYq8EhDr9kAUy6B2numoqoQQRdsYKK', '$2y$12$QVETcMqTtOedrsgiOHFPsu.gYq8EhDr9kAUy6B2numoqoQQRdsYKK', '', '', '2025-12-30 02:51:26', '2025-12-30 02:51:26', '2026-01-07 04:19:36', '2026-01-07 04:19:36', '1007', '1007', 'user', 'user', 'active', 'active', 'Risk Management', 'Risk Management', '', '', '081234567807', '081234567807', '', '');
INSERT INTO `users` VALUES ('11', '11', 'Fitri Handayani', 'Fitri Handayani', 'fitri.handayani@bni.co.id', 'fitri.handayani@bni.co.id', '', '', '$2y$12$qtga2nd5GrU1OUFs2bJXG.AqpALyelY.zRxynyU2UsHZkkXnLuOI6', '$2y$12$qtga2nd5GrU1OUFs2bJXG.AqpALyelY.zRxynyU2UsHZkkXnLuOI6', '', '', '2025-12-30 02:51:26', '2025-12-30 02:51:26', '2026-01-07 04:19:36', '2026-01-07 04:19:36', '1008', '1008', 'user', 'user', 'active', 'active', 'Compliance', 'Compliance', '', '', '081234567808', '081234567808', '', '');
INSERT INTO `users` VALUES ('12', '12', 'Andika Pratama', 'Andika Pratama', 'andika.pratama@bni.co.id', 'andika.pratama@bni.co.id', '', '', '$2y$12$h/Ijkt2zOl8B3FFa06uz9.rJszJ3BEsVJK21b6W5YKhOPjdok0ufq', '$2y$12$h/Ijkt2zOl8B3FFa06uz9.rJszJ3BEsVJK21b6W5YKhOPjdok0ufq', '', '', '2025-12-30 02:51:26', '2025-12-30 02:51:26', '2026-01-07 04:19:36', '2026-01-07 04:19:36', '1009', '1009', 'user', 'user', 'active', 'active', 'IT', 'IT', '', '', '081234567809', '081234567809', '', '');
INSERT INTO `users` VALUES ('13', '13', 'Rina Wulandari', 'Rina Wulandari', 'rina.wulandari@bni.co.id', 'rina.wulandari@bni.co.id', '', '', '$2y$12$N9k1uikEsnleRzXt1HjtdOX4a4ihng8OyYXQ2gbmuJ2xuB0bNRfPO', '$2y$12$N9k1uikEsnleRzXt1HjtdOX4a4ihng8OyYXQ2gbmuJ2xuB0bNRfPO', '', '', '2025-12-30 02:51:26', '2025-12-30 02:51:26', '2026-01-07 04:19:36', '2026-01-07 04:19:36', '1010', '1010', 'user', 'user', 'active', 'active', 'HR', 'HR', '', '', '081234567810', '081234567810', '', '');
INSERT INTO `users` VALUES ('14', '14', 'Hendra Gunawan', 'Hendra Gunawan', 'hendra.gunawan@bni.co.id', 'hendra.gunawan@bni.co.id', '', '', '$2y$12$9hIG2UL1Avb11tlvB7WCO.ijAD5T4BLffTKHu/LzbRdAYz5jOSiEu', '$2y$12$9hIG2UL1Avb11tlvB7WCO.ijAD5T4BLffTKHu/LzbRdAYz5jOSiEu', '', '', '2025-12-30 02:51:26', '2025-12-30 02:51:26', '2026-01-07 04:19:36', '2026-01-07 04:19:36', '1011', '1011', 'user', 'user', 'active', 'active', 'Finance', 'Finance', '', '', '081234567811', '081234567811', '', '');
INSERT INTO `users` VALUES ('15', '15', 'Linda Kusuma', 'Linda Kusuma', 'linda.kusuma@bni.co.id', 'linda.kusuma@bni.co.id', '', '', '$2y$12$wvSrBd.syJuDX3mwFCGdPu06Sksu/.k4VrYd20ET24CuQNKtD.0zi', '$2y$12$wvSrBd.syJuDX3mwFCGdPu06Sksu/.k4VrYd20ET24CuQNKtD.0zi', '', '', '2025-12-30 02:51:26', '2025-12-30 02:51:26', '2026-01-07 04:19:36', '2026-01-07 04:19:36', '1012', '1012', 'user', 'user', 'active', 'active', 'Marketing', 'Marketing', '', '', '081234567812', '081234567812', '', '');
INSERT INTO `users` VALUES ('16', '16', 'Bambang Wijaya', 'Bambang Wijaya', 'bambang.wijaya@bni.co.id', 'bambang.wijaya@bni.co.id', '', '', '$2y$12$0TqvxoyYy19epRzx1NdubusJOt4mRKm.itcO/HUjmYUfST5aS1NEO', '$2y$12$0TqvxoyYy19epRzx1NdubusJOt4mRKm.itcO/HUjmYUfST5aS1NEO', '', '', '2025-12-30 02:51:26', '2025-12-30 02:51:26', '2026-01-07 04:19:36', '2026-01-07 04:19:36', '1013', '1013', 'user', 'user', 'active', 'active', 'Operations', 'Operations', '', '', '081234567813', '081234567813', '', '');
INSERT INTO `users` VALUES ('17', '17', 'Ratna Sari', 'Ratna Sari', 'ratna.sari@bni.co.id', 'ratna.sari@bni.co.id', '', '', '$2y$12$SV2uYmfPTfZ0ebb.hDqOFuQuKvEbXzDSMtohy5KLkZL3nsaZ79A6O', '$2y$12$SV2uYmfPTfZ0ebb.hDqOFuQuKvEbXzDSMtohy5KLkZL3nsaZ79A6O', '', '', '2025-12-30 02:51:26', '2025-12-30 02:51:26', '2026-01-07 04:19:36', '2026-01-07 04:19:36', '1014', '1014', 'user', 'user', 'active', 'active', 'Legal', 'Legal', '', '', '081234567814', '081234567814', '', '');
INSERT INTO `users` VALUES ('18', '18', 'Dedi Kurniawan', 'Dedi Kurniawan', 'dedi.kurniawan@bni.co.id', 'dedi.kurniawan@bni.co.id', '', '', '$2y$12$jAzbzFhNiAqXisfqmo7sCuddgWaMwv/oPE57UHMJr0PjOTc.ucm8G', '$2y$12$jAzbzFhNiAqXisfqmo7sCuddgWaMwv/oPE57UHMJr0PjOTc.ucm8G', '', '', '2025-12-30 02:51:26', '2025-12-30 02:51:26', '2026-01-07 04:19:36', '2026-01-07 04:19:36', '1015', '1015', 'user', 'user', 'active', 'active', 'Risk Management', 'Risk Management', '', '', '081234567815', '081234567815', '', '');
INSERT INTO `users` VALUES ('19', '19', 'Sri Rahayu', 'Sri Rahayu', 'sri.rahayu@bni.co.id', 'sri.rahayu@bni.co.id', '', '', '$2y$12$m.q7yhi22Mz3NYRSpYDCW.4otE6hWqKdzcgowraKHtlbQ/Ao082lK', '$2y$12$m.q7yhi22Mz3NYRSpYDCW.4otE6hWqKdzcgowraKHtlbQ/Ao082lK', '', '', '2025-12-30 02:51:26', '2025-12-30 02:51:26', '2026-01-07 04:19:36', '2026-01-07 04:19:36', '1016', '1016', 'user', 'user', 'active', 'active', 'Compliance', 'Compliance', '', '', '081234567816', '081234567816', '', '');
INSERT INTO `users` VALUES ('20', '20', 'Agus Salim', 'Agus Salim', 'agus.salim@bni.co.id', 'agus.salim@bni.co.id', '', '', '$2y$12$IqhJ1shpmErjQ2W3BrodPuSJZW3I1/XJMSp.4rz/KKZt.U6sK1HHW', '$2y$12$IqhJ1shpmErjQ2W3BrodPuSJZW3I1/XJMSp.4rz/KKZt.U6sK1HHW', '', '', '2025-12-30 02:51:26', '2025-12-30 02:51:26', '2026-01-07 04:19:36', '2026-01-07 04:19:36', '1017', '1017', 'admin', 'admin', 'active', 'active', 'IT', 'IT', '', '', '081234567817', '081234567817', '', '');
INSERT INTO `users` VALUES ('21', '21', 'Dian Permata', 'Dian Permata', 'dian.permata@bni.co.id', 'dian.permata@bni.co.id', '', '', '$2y$12$aOAActY8SXQzpTg3BQyLSeTKH/Jynx7tCCJzyDQSfhh1PHAFtM7Xq', '$2y$12$aOAActY8SXQzpTg3BQyLSeTKH/Jynx7tCCJzyDQSfhh1PHAFtM7Xq', '', '', '2025-12-30 02:51:26', '2025-12-30 02:51:26', '2026-01-07 04:19:36', '2026-01-07 04:19:36', '1018', '1018', 'user', 'user', 'active', 'active', 'HR', 'HR', '', '', '081234567818', '081234567818', '', '');
INSERT INTO `users` VALUES ('22', '22', 'Joko Widodo', 'Joko Widodo', 'joko.widodo@bni.co.id', 'joko.widodo@bni.co.id', '', '', '$2y$12$K6EC4ZqtX/0kNymFTAspKexVaUsXf1kU3qfMGrq0Q5fywWnQuBHqS', '$2y$12$K6EC4ZqtX/0kNymFTAspKexVaUsXf1kU3qfMGrq0Q5fywWnQuBHqS', '', '', '2025-12-30 02:51:26', '2025-12-30 02:51:26', '2026-01-07 04:19:36', '2026-01-07 04:19:36', '1019', '1019', 'user', 'user', 'active', 'active', 'Finance', 'Finance', '', '', '081234567819', '081234567819', '', '');
INSERT INTO `users` VALUES ('23', '23', 'Nurul Hidayah', 'Nurul Hidayah', 'nurul.hidayah@bni.co.id', 'nurul.hidayah@bni.co.id', '', '', '$2y$12$0kecbu4nza76YP3Wem9GquIfvi9yTKBnnVfwstmo6a5T8OWOdRrs6', '$2y$12$0kecbu4nza76YP3Wem9GquIfvi9yTKBnnVfwstmo6a5T8OWOdRrs6', '', '', '2025-12-30 02:51:26', '2025-12-30 02:51:26', '2026-01-07 04:19:36', '2026-01-07 04:19:36', '1020', '1020', 'user', 'user', 'inactive', 'inactive', 'Marketing', 'Marketing', '', '', '081234567820', '081234567820', '', '');

CREATE TABLE `training_schedules` (
`id` INT NOT NULL ,
`title` VARCHAR(255) NOT NULL ,
`date` DATE NOT NULL ,
`start_time` TIME NULL ,
`end_time` TIME NULL ,
`location` VARCHAR(255) NULL ,
`description` TEXT NULL ,
`program_id` INT NULL ,
`type` VARCHAR(255) NOT NULL DEFAULT 'training',
`capacity` INT NULL ,
`enrolled` INT NOT NULL DEFAULT '0',
`status` VARCHAR(255) NOT NULL DEFAULT 'scheduled',
`created_at` DATETIME NULL ,
`updated_at` DATETIME NULL ,
`trainer_ids` TEXT NULL 
);

INSERT INTO `training_schedules` VALUES ('1', '1', 'apa gek', 'apa gek', '2025-12-29 00:00:00', '2025-12-29 00:00:00', '09:00', '09:00', '16:04', '16:04', 'https://www.youtube.com/watch?v=xAWDqdpOlu8&list=RDxAWDqdpOlu8&start_radio=1', 'https://www.youtube.com/watch?v=xAWDqdpOlu8&list=RDxAWDqdpOlu8&start_radio=1', '✨ Workshop interaktif fokus pada penerapan regulasi anti-pencucian uang (AML). Diskusi mendalam tentang red flags dalam transaksi, teknologi detection, dan prosedur laporan mencurigakan (STR).', '✨ Workshop interaktif fokus pada penerapan regulasi anti-pencucian uang (AML). Diskusi mendalam tentang red flags dalam transaksi, teknologi detection, dan prosedur laporan mencurigakan (STR).', '', '', 'training', 'training', '', '', '0', '0', 'scheduled', 'scheduled', '2025-12-29 07:08:09', '2025-12-29 07:08:09', '2025-12-29 07:08:09', '2025-12-29 07:08:09', '"[5,3,2]"', '"[5,3,2]"');
INSERT INTO `training_schedules` VALUES ('2', '2', 'apa aja', 'apa aja', '2025-12-31 00:00:00', '2025-12-31 00:00:00', '09:00', '09:00', '11:00', '11:00', 'meeting room lt 12', 'meeting room lt 12', '✨ Pelatihan teknis mengenai sistem keamanan siber modern untuk financial institutions. Topik mencakup threat assessment, incident response, penetration testing, dan compliance dengan standar ISO 27001.', '✨ Pelatihan teknis mengenai sistem keamanan siber modern untuk financial institutions. Topik mencakup threat assessment, incident response, penetration testing, dan compliance dengan standar ISO 27001.', '', '', 'training', 'training', '', '', '0', '0', 'scheduled', 'scheduled', '2025-12-29 07:09:08', '2025-12-29 07:09:08', '2025-12-29 07:09:08', '2025-12-29 07:09:08', '"[1,5]"', '"[1,5]"');
INSERT INTO `training_schedules` VALUES ('3', '3', 'aaaa', 'aaaa', '2026-01-07 00:00:00', '2026-01-07 00:00:00', '09:00', '09:00', '11:00', '11:00', 'aaa', 'aaa', '✨ Sesi pelatihan komprehensif yang membahas strategi kepatuhan terbaru sesuai regulasi OJK 2025. Peserta akan mempelajari studi kasus pencucian uang, mitigasi risiko digital, dan best practices industri perbankan.', '✨ Sesi pelatihan komprehensif yang membahas strategi kepatuhan terbaru sesuai regulasi OJK 2025. Peserta akan mempelajari studi kasus pencucian uang, mitigasi risiko digital, dan best practices industri perbankan.', '', '', 'training', 'training', '', '', '0', '0', 'scheduled', 'scheduled', '2025-12-29 07:10:04', '2025-12-29 07:10:04', '2025-12-29 07:10:04', '2025-12-29 07:10:04', '"[1,5]"', '"[1,5]"');

CREATE TABLE `announcements` (
`id` INT NOT NULL ,
`title` VARCHAR(255) NOT NULL ,
`content` TEXT NOT NULL ,
`type` VARCHAR(255) NOT NULL DEFAULT 'general',
`status` VARCHAR(255) NOT NULL DEFAULT 'active',
`start_date` DATETIME NULL ,
`end_date` DATETIME NULL ,
`is_featured` TINYINT(1) NOT NULL DEFAULT '0',
`display_type` VARCHAR(255) NOT NULL DEFAULT 'banner',
`created_at` DATETIME NULL ,
`updated_at` DATETIME NULL ,
`views` INT NOT NULL DEFAULT '0',
`clicks` INT NOT NULL DEFAULT '0'
);

INSERT INTO `announcements` VALUES ('1', '1', 'Sistem Update - Maintenance Scheduled', 'Sistem Update - Maintenance Scheduled', 'Dear Users, sistem akan menjalani maintenance rutin pada hari Minggu, 31 Desember 2025 pukul 01:00 - 04:00 WIB. Mohon maaf atas ketidaknyamanannya.', 'Dear Users, sistem akan menjalani maintenance rutin pada hari Minggu, 31 Desember 2025 pukul 01:00 - 04:00 WIB. Mohon maaf atas ketidaknyamanannya.', 'maintenance', 'maintenance', 'active', 'active', '2025-12-29 03:30:52', '2025-12-29 03:30:52', '2026-01-01 03:30:52', '2026-01-01 03:30:52', '1', '1', 'banner', 'banner', '2025-12-27 03:30:52', '2025-12-27 03:30:52', '2025-12-27 03:30:52', '2025-12-27 03:30:52', '245', '245', '67', '67');
INSERT INTO `announcements` VALUES ('3', '3', 'Webinar: Compliance & Risk Management', 'Webinar: Compliance & Risk Management', 'Ikuti webinar eksklusif tentang Compliance & Risk Management bersama expert dari industri. Daftarkan diri Anda sekarang, tempat terbatas!', 'Ikuti webinar eksklusif tentang Compliance & Risk Management bersama expert dari industri. Daftarkan diri Anda sekarang, tempat terbatas!', 'event', 'event', 'active', 'active', '2025-12-28 03:30:52', '2025-12-28 03:30:52', '2026-01-06 03:30:52', '2026-01-06 03:30:52', '0', '0', 'notification', 'notification', '2025-12-28 03:30:52', '2025-12-28 03:30:52', '2025-12-28 03:30:52', '2025-12-28 03:30:52', '156', '156', '42', '42');
INSERT INTO `announcements` VALUES ('4', '4', 'Perubahan Kebijakan Data Privacy', 'Perubahan Kebijakan Data Privacy', 'Kami telah memperbarui kebijakan privasi data kami untuk memberikan perlindungan yang lebih baik. Silakan baca detail kebijakan terbaru di halaman Privacy Policy.', 'Kami telah memperbarui kebijakan privasi data kami untuk memberikan perlindungan yang lebih baik. Silakan baca detail kebijakan terbaru di halaman Privacy Policy.', 'general', 'general', 'active', 'active', '2025-12-23 03:30:52', '2025-12-23 03:30:52', '', '', '0', '0', 'banner', 'banner', '2025-12-23 03:30:52', '2025-12-23 03:30:52', '2025-12-23 03:30:52', '2025-12-23 03:30:52', '892', '892', '124', '124');
INSERT INTO `announcements` VALUES ('5', '5', '🚨 URGENT: Security Alert', '🚨 URGENT: Security Alert', 'Kami telah mendeteksi aktivitas mencurigakan pada beberapa akun. Mohon segera ubah password Anda dan aktifkan 2FA untuk keamanan maksimal.', 'Kami telah mendeteksi aktivitas mencurigakan pada beberapa akun. Mohon segera ubah password Anda dan aktifkan 2FA untuk keamanan maksimal.', 'urgent', 'urgent', 'active', 'active', '2025-12-29 21:30:52', '2025-12-29 21:30:52', '2025-12-31 03:30:52', '2025-12-31 03:30:52', '1', '1', 'modal', 'modal', '2025-12-29 21:30:52', '2025-12-29 21:30:52', '2025-12-29 21:30:52', '2025-12-29 21:30:52', '1234', '1234', '456', '456');
INSERT INTO `announcements` VALUES ('6', '6', 'Modul Baru: Advanced Excel Training', 'Modul Baru: Advanced Excel Training', 'Modul pelatihan Excel tingkat lanjut sudah tersedia! Pelajari formula kompleks, pivot tables, dan automation dengan VBA.', 'Modul pelatihan Excel tingkat lanjut sudah tersedia! Pelajari formula kompleks, pivot tables, dan automation dengan VBA.', 'general', 'general', 'active', 'active', '2026-01-02 03:30:52', '2026-01-02 03:30:52', '2026-01-29 03:30:52', '2026-01-29 03:30:52', '0', '0', 'notification', 'notification', '2025-12-30 03:30:52', '2025-12-30 03:30:52', '2025-12-30 03:32:44', '2025-12-30 03:32:44', '0', '0', '0', '0');
INSERT INTO `announcements` VALUES ('7', '7', 'System Performance Improvement', 'System Performance Improvement', 'Kami telah meningkatkan performa sistem! Kecepatan loading meningkat 40%, bug fixes, dan UI improvements.', 'Kami telah meningkatkan performa sistem! Kecepatan loading meningkat 40%, bug fixes, dan UI improvements.', 'general', 'general', 'inactive', 'inactive', '2025-12-20 03:30:52', '2025-12-20 03:30:52', '2025-12-29 03:30:52', '2025-12-29 03:30:52', '0', '0', 'banner', 'banner', '2025-12-20 03:30:52', '2025-12-20 03:30:52', '2025-12-29 03:30:52', '2025-12-29 03:30:52', '678', '678', '89', '89');
INSERT INTO `announcements` VALUES ('8', '8', 'maintenance server', 'maintenance server', 'halo', 'halo', 'maintenance', 'maintenance', 'active', 'active', '2025-12-30', '2025-12-30', '2026-01-03', '2026-01-03', '1', '1', 'banner', 'banner', '2025-12-30 03:32:33', '2025-12-30 03:32:33', '2025-12-30 03:32:33', '2025-12-30 03:32:33', '0', '0', '0', '0');
INSERT INTO `announcements` VALUES ('9', '9', 'Selamat Datang di HCMS!', 'Selamat Datang di HCMS!', 'Sistem e-learning terbaru telah diluncurkan dengan fitur-fitur canggih untuk meningkatkan pengalaman belajar Anda.', 'Sistem e-learning terbaru telah diluncurkan dengan fitur-fitur canggih untuk meningkatkan pengalaman belajar Anda.', 'general', 'general', 'active', 'active', '', '', '', '', '1', '1', 'banner', 'banner', '2025-12-31 08:13:15', '2025-12-31 08:13:15', '2025-12-31 08:13:15', '2025-12-31 08:13:15', '0', '0', '0', '0');
INSERT INTO `announcements` VALUES ('10', '10', 'Update Sistem Penting!', 'Update Sistem Penting!', 'Sistem akan menjalani maintenance terjadwal pada tanggal 5 Januari 2026. Pastikan Anda menyimpan progress belajar Anda sebelum waktu tersebut.', 'Sistem akan menjalani maintenance terjadwal pada tanggal 5 Januari 2026. Pastikan Anda menyimpan progress belajar Anda sebelum waktu tersebut.', 'urgent', 'urgent', 'active', 'active', '', '', '', '', '0', '0', 'modal', 'modal', '2025-12-31 08:13:25', '2025-12-31 08:13:25', '2025-12-31 08:13:25', '2025-12-31 08:13:25', '0', '0', '0', '0');
INSERT INTO `announcements` VALUES ('11', '11', 'yoga krisna utama', 'yoga krisna utama', 'halaoahaala', 'halaoahaala', 'event', 'event', 'active', 'active', '2025-12-31', '2025-12-31', '2026-01-08', '2026-01-08', '1', '1', 'banner', 'banner', '2025-12-31 08:21:34', '2025-12-31 08:21:34', '2025-12-31 08:21:34', '2025-12-31 08:21:34', '0', '0', '0', '0');

CREATE TABLE `program_notifications` (
`id` INT NOT NULL ,
`module_id` INT NULL ,
`user_id` INT NULL ,
`type` VARCHAR(255) NOT NULL ,
`title` VARCHAR(255) NOT NULL ,
`message` TEXT NOT NULL ,
`is_read` TINYINT(1) NOT NULL DEFAULT '0',
`read_at` DATETIME NULL ,
`data` TEXT NULL ,
`created_at` DATETIME NULL ,
`updated_at` DATETIME NULL ,
`recipients` VARCHAR(255) NOT NULL DEFAULT 'all',
`recipient_ids` TEXT NULL ,
`is_scheduled` TINYINT(1) NOT NULL DEFAULT '0',
`scheduled_at` DATETIME NULL ,
`recipients_count` INT NOT NULL DEFAULT '0',
`status` VARCHAR(255) NOT NULL DEFAULT 'sent',
`stats` TEXT NULL 
);

INSERT INTO `program_notifications` VALUES ('1', '1', '', '', '', '', 'info', 'info', 'Penting: Update Kebijakan Keamanan', 'Penting: Update Kebijakan Keamanan', 'Halo Tim! Kami telah memperbarui kebijakan keamanan data. Mohon luangkan waktu 5 menit untuk membacanya di menu Dokumen. Terima kasih atas kerjasama Anda menjaga keamanan data perusahaan. 🔒', 'Halo Tim! Kami telah memperbarui kebijakan keamanan data. Mohon luangkan waktu 5 menit untuk membacanya di menu Dokumen. Terima kasih atas kerjasama Anda menjaga keamanan data perusahaan. 🔒', '0', '0', '', '', '', '', '2025-12-30 03:36:18', '2025-12-30 03:36:18', '2025-12-30 03:36:18', '2025-12-30 03:36:18', 'all', 'all', '[]', '[]', '0', '0', '', '', '0', '0', 'sent', 'sent', '', '');
INSERT INTO `program_notifications` VALUES ('2', '2', '', '', '', '', 'info', 'info', 'Welcome to the Learning Platform!', 'Welcome to the Learning Platform!', 'Selamat datang di platform e-learning kami! Mulai perjalanan belajar Anda dengan mengakses modul-modul pelatihan yang telah disiapkan.', 'Selamat datang di platform e-learning kami! Mulai perjalanan belajar Anda dengan mengakses modul-modul pelatihan yang telah disiapkan.', '0', '0', '', '', '', '', '2025-12-25 03:37:57', '2025-12-25 03:37:57', '2025-12-25 03:37:57', '2025-12-25 03:37:57', 'all', 'all', '', '', '0', '0', '', '', '250', '250', 'sent', 'sent', '{"sent":250,"read":178,"clicked":42}', '{"sent":250,"read":178,"clicked":42}');
INSERT INTO `program_notifications` VALUES ('3', '3', '', '', '', '', 'warning', 'warning', 'Training Deadline Approaching', 'Training Deadline Approaching', '⚠️ Reminder: Modul "Compliance Training" harus diselesaikan dalam 3 hari ke depan. Jangan sampai terlewat!', '⚠️ Reminder: Modul "Compliance Training" harus diselesaikan dalam 3 hari ke depan. Jangan sampai terlewat!', '0', '0', '', '', '', '', '2025-12-27 03:37:57', '2025-12-27 03:37:57', '2025-12-27 03:37:57', '2025-12-27 03:37:57', 'all', 'all', '', '', '0', '0', '', '', '180', '180', 'sent', 'sent', '{"sent":180,"read":152,"clicked":89}', '{"sent":180,"read":152,"clicked":89}');
INSERT INTO `program_notifications` VALUES ('4', '4', '', '', '', '', 'success', 'success', 'Congratulations! Certificate Earned', 'Congratulations! Certificate Earned', '🎉 Selamat! Anda telah menyelesaikan modul "Advanced Excel" dengan nilai sempurna. Sertifikat sudah tersedia untuk diunduh.', '🎉 Selamat! Anda telah menyelesaikan modul "Advanced Excel" dengan nilai sempurna. Sertifikat sudah tersedia untuk diunduh.', '0', '0', '', '', '', '', '2025-12-28 03:37:57', '2025-12-28 03:37:57', '2025-12-28 03:37:57', '2025-12-28 03:37:57', 'all', 'all', '', '', '0', '0', '', '', '45', '45', 'sent', 'sent', '{"sent":45,"read":43,"clicked":38}', '{"sent":45,"read":43,"clicked":38}');
INSERT INTO `program_notifications` VALUES ('5', '5', '', '', '', '', 'info', 'info', 'New Learning Modules Available', 'New Learning Modules Available', '📚 Modul baru telah ditambahkan: "Digital Marketing Fundamentals" dan "Project Management Basics". Mulai belajar sekarang!', '📚 Modul baru telah ditambahkan: "Digital Marketing Fundamentals" dan "Project Management Basics". Mulai belajar sekarang!', '0', '0', '', '', '', '', '2025-12-29 03:37:57', '2025-12-29 03:37:57', '2025-12-29 03:37:57', '2025-12-29 03:37:57', 'all', 'all', '', '', '0', '0', '', '', '320', '320', 'sent', 'sent', '{"sent":320,"read":198,"clicked":67}', '{"sent":320,"read":198,"clicked":67}');
INSERT INTO `program_notifications` VALUES ('6', '6', '', '', '', '', 'error', 'error', 'Quiz Attempt Failed', 'Quiz Attempt Failed', '❌ Sayang sekali, Anda belum berhasil melewati kuis "Risk Management". Nilai minimum: 70%. Silakan ulangi setelah mempelajari materi kembali.', '❌ Sayang sekali, Anda belum berhasil melewati kuis "Risk Management". Nilai minimum: 70%. Silakan ulangi setelah mempelajari materi kembali.', '0', '0', '', '', '', '', '2025-12-29 15:37:57', '2025-12-29 15:37:57', '2025-12-29 15:37:57', '2025-12-29 15:37:57', 'all', 'all', '', '', '0', '0', '', '', '12', '12', 'sent', 'sent', '{"sent":12,"read":11,"clicked":9}', '{"sent":12,"read":11,"clicked":9}');
INSERT INTO `program_notifications` VALUES ('7', '7', '', '', '', '', 'info', 'info', 'System Maintenance Notice', 'System Maintenance Notice', '🔧 Scheduled maintenance: Platform akan offline pada 31 Des 2025, 02:00-05:00 WIB untuk peningkatan sistem. Mohon rencanakan aktivitas belajar Anda.', '🔧 Scheduled maintenance: Platform akan offline pada 31 Des 2025, 02:00-05:00 WIB untuk peningkatan sistem. Mohon rencanakan aktivitas belajar Anda.', '0', '0', '', '', '', '', '2025-12-30 03:37:57', '2025-12-30 03:37:57', '2025-12-30 03:37:57', '2025-12-30 03:37:57', 'all', 'all', '', '', '1', '1', '2025-12-31 20:00:00', '2025-12-31 20:00:00', '0', '0', 'scheduled', 'scheduled', '{"sent":0,"read":0,"clicked":0}', '{"sent":0,"read":0,"clicked":0}');
INSERT INTO `program_notifications` VALUES ('8', '8', '', '', '', '', 'success', 'success', 'Monthly Progress Report', 'Monthly Progress Report', '📊 Laporan bulanan Anda: 8 modul selesai, 450 XP earned, ranking #23 dari 250 peserta. Pertahankan konsistensi belajar Anda!', '📊 Laporan bulanan Anda: 8 modul selesai, 450 XP earned, ranking #23 dari 250 peserta. Pertahankan konsistensi belajar Anda!', '0', '0', '', '', '', '', '2025-12-23 03:37:57', '2025-12-23 03:37:57', '2025-12-23 03:37:57', '2025-12-23 03:37:57', 'all', 'all', '', '', '0', '0', '', '', '250', '250', 'sent', 'sent', '{"sent":250,"read":189,"clicked":72}', '{"sent":250,"read":189,"clicked":72}');
INSERT INTO `program_notifications` VALUES ('9', '9', '', '', '', '', 'info', 'info', 'Tugas Baru Tersedia', 'Tugas Baru Tersedia', 'Anda memiliki tugas baru dalam modul Advanced PHP Programming. Silakan check dashboard Anda.', 'Anda memiliki tugas baru dalam modul Advanced PHP Programming. Silakan check dashboard Anda.', '0', '0', '', '', '', '', '2025-12-31 08:13:33', '2025-12-31 08:13:33', '2025-12-31 08:13:33', '2025-12-31 08:13:33', 'all', 'all', '', '', '0', '0', '', '', '0', '0', 'sent', 'sent', '', '');
INSERT INTO `program_notifications` VALUES ('10', '10', '', '', '', '', 'success', 'success', 'Sertifikat Siap Diunduh', 'Sertifikat Siap Diunduh', 'Selamat! Sertifikat untuk program Web Development Fundamentals telah selesai diproses dan siap untuk diunduh dari dashboard Anda.', 'Selamat! Sertifikat untuk program Web Development Fundamentals telah selesai diproses dan siap untuk diunduh dari dashboard Anda.', '0', '0', '', '', '', '', '2025-12-31 08:13:41', '2025-12-31 08:13:41', '2025-12-31 08:13:41', '2025-12-31 08:13:41', 'all', 'all', '', '', '0', '0', '', '', '0', '0', 'sent', 'sent', '', '');
INSERT INTO `program_notifications` VALUES ('11', '11', '', '', '', '', 'info', 'info', 'yoga krisna utama', 'yoga krisna utama', 'Halo Tim! Kami telah memperbarui kebijakan keamanan data. Mohon luangkan waktu 5 menit untuk membacanya di menu Dokumen. Terima kasih atas kerjasama Anda menjaga keamanan data perusahaan. 🔒', 'Halo Tim! Kami telah memperbarui kebijakan keamanan data. Mohon luangkan waktu 5 menit untuk membacanya di menu Dokumen. Terima kasih atas kerjasama Anda menjaga keamanan data perusahaan. 🔒', '0', '0', '', '', '', '', '2025-12-31 08:24:48', '2025-12-31 08:24:48', '2025-12-31 08:24:48', '2025-12-31 08:24:48', 'all', 'all', '[]', '[]', '0', '0', '', '', '100', '100', 'sent', 'sent', '{"sent":100,"read":0,"clicked":0}', '{"sent":100,"read":0,"clicked":0}');

CREATE TABLE `system_settings` (
`id` INT NOT NULL ,
`key` VARCHAR(255) NOT NULL ,
`value` TEXT NULL ,
`type` VARCHAR(255) NOT NULL DEFAULT 'string',
`group` VARCHAR(255) NOT NULL DEFAULT 'general',
`description` TEXT NULL ,
`created_at` DATETIME NULL ,
`updated_at` DATETIME NULL 
);

INSERT INTO `system_settings` VALUES ('1', '1', 'app_name', 'app_name', 'HCMS E-LEARNING', 'HCMS E-LEARNING', 'string', 'string', 'general', 'general', 'Application name displayed in the system', 'Application name displayed in the system', '2025-12-30 03:44:04', '2025-12-30 03:44:04', '2025-12-31 07:15:56', '2025-12-31 07:15:56');
INSERT INTO `system_settings` VALUES ('2', '2', 'app_url', 'app_url', 'http://localhost', 'http://localhost', 'string', 'string', 'general', 'general', 'Base URL of the application', 'Base URL of the application', '2025-12-30 03:44:04', '2025-12-30 03:44:04', '2025-12-31 07:15:56', '2025-12-31 07:15:56');
INSERT INTO `system_settings` VALUES ('3', '3', 'timezone', 'timezone', 'Asia/Jakarta', 'Asia/Jakarta', 'string', 'string', 'general', 'general', 'Default timezone for the system', 'Default timezone for the system', '2025-12-30 03:44:04', '2025-12-30 03:44:04', '2025-12-31 07:15:56', '2025-12-31 07:15:56');
INSERT INTO `system_settings` VALUES ('4', '4', 'locale', 'locale', 'en', 'en', 'string', 'string', 'general', 'general', 'Default language locale', 'Default language locale', '2025-12-30 03:44:04', '2025-12-30 03:44:04', '2026-01-07 03:42:30', '2026-01-07 03:42:30');
INSERT INTO `system_settings` VALUES ('5', '5', 'maintenance_mode', 'maintenance_mode', 'false', 'false', 'boolean', 'boolean', 'general', 'general', 'Enable/disable maintenance mode', 'Enable/disable maintenance mode', '2025-12-30 03:44:04', '2025-12-30 03:44:04', '2025-12-31 07:15:56', '2025-12-31 07:15:56');
INSERT INTO `system_settings` VALUES ('6', '6', 'enable_two_factor', 'enable_two_factor', 'true', 'true', 'boolean', 'boolean', 'security', 'security', 'Enable two-factor authentication', 'Enable two-factor authentication', '2025-12-30 03:44:04', '2025-12-30 03:44:04', '2025-12-31 07:15:56', '2025-12-31 07:15:56');
INSERT INTO `system_settings` VALUES ('7', '7', 'session_timeout', 'session_timeout', '45', '45', 'integer', 'integer', 'security', 'security', 'Session timeout in minutes', 'Session timeout in minutes', '2025-12-30 03:44:04', '2025-12-30 03:44:04', '2025-12-31 07:15:56', '2025-12-31 07:15:56');
INSERT INTO `system_settings` VALUES ('8', '8', 'max_upload_size', 'max_upload_size', '50', '50', 'integer', 'integer', 'data', 'data', 'Maximum file upload size in MB', 'Maximum file upload size in MB', '2025-12-30 03:44:04', '2025-12-30 03:44:04', '2025-12-31 07:15:56', '2025-12-31 07:15:56');
INSERT INTO `system_settings` VALUES ('9', '9', 'backup_enabled', 'backup_enabled', 'true', 'true', 'boolean', 'boolean', 'data', 'data', 'Enable automatic backups', 'Enable automatic backups', '2025-12-30 03:44:04', '2025-12-30 03:44:04', '2025-12-31 07:15:56', '2025-12-31 07:15:56');
INSERT INTO `system_settings` VALUES ('10', '10', 'backup_frequency', 'backup_frequency', 'daily', 'daily', 'string', 'string', 'data', 'data', 'Backup frequency (daily, weekly, monthly)', 'Backup frequency (daily, weekly, monthly)', '2025-12-30 03:44:04', '2025-12-30 03:44:04', '2025-12-31 07:15:56', '2025-12-31 07:15:56');
INSERT INTO `system_settings` VALUES ('11', '11', 'enable_api', 'enable_api', 'true', 'true', 'boolean', 'boolean', 'api', 'api', 'Enable API access', 'Enable API access', '2025-12-30 03:44:04', '2025-12-30 03:44:04', '2025-12-31 07:15:56', '2025-12-31 07:15:56');
INSERT INTO `system_settings` VALUES ('12', '12', 'api_rate_limit', 'api_rate_limit', '1000', '1000', 'integer', 'integer', 'api', 'api', 'API rate limit per hour', 'API rate limit per hour', '2025-12-30 03:44:04', '2025-12-30 03:44:04', '2025-12-31 07:15:56', '2025-12-31 07:15:56');

CREATE TABLE `user_bookmarks` (
`id` INT NOT NULL ,
`user_id` INT NOT NULL ,
`material_id` INT NOT NULL ,
`module_id` INT NOT NULL ,
`bookmarked_at` DATETIME NOT NULL ,
`created_at` DATETIME NULL ,
`updated_at` DATETIME NULL 
);

INSERT INTO `user_bookmarks` VALUES ('1', '1', '1', '1', '16', '16', '3', '3', '2025-12-29 07:28:36', '2025-12-29 07:28:36', '2026-01-05 07:28:36', '2026-01-05 07:28:36', '2026-01-05 07:28:36', '2026-01-05 07:28:36');
INSERT INTO `user_bookmarks` VALUES ('2', '2', '1', '1', '17', '17', '3', '3', '2026-01-03 07:28:36', '2026-01-03 07:28:36', '2026-01-05 07:28:36', '2026-01-05 07:28:36', '2026-01-05 07:28:36', '2026-01-05 07:28:36');
INSERT INTO `user_bookmarks` VALUES ('3', '3', '1', '1', '18', '18', '5', '5', '2025-12-31 07:28:36', '2025-12-31 07:28:36', '2026-01-05 07:28:36', '2026-01-05 07:28:36', '2026-01-05 07:28:36', '2026-01-05 07:28:36');
INSERT INTO `user_bookmarks` VALUES ('4', '4', '2', '2', '16', '16', '3', '3', '2026-01-04 07:29:11', '2026-01-04 07:29:11', '2026-01-05 07:29:11', '2026-01-05 07:29:11', '2026-01-05 07:29:11', '2026-01-05 07:29:11');
INSERT INTO `user_bookmarks` VALUES ('5', '5', '2', '2', '17', '17', '3', '3', '2026-01-02 07:29:11', '2026-01-02 07:29:11', '2026-01-05 07:29:11', '2026-01-05 07:29:11', '2026-01-05 07:29:11', '2026-01-05 07:29:11');
INSERT INTO `user_bookmarks` VALUES ('6', '6', '2', '2', '18', '18', '5', '5', '2025-12-30 07:29:11', '2025-12-30 07:29:11', '2026-01-05 07:29:11', '2026-01-05 07:29:11', '2026-01-05 07:29:11', '2026-01-05 07:29:11');

CREATE TABLE `user_progress` (
`id` INT NOT NULL ,
`user_id` INT NOT NULL ,
`training_material_id` INT NOT NULL ,
`module_id` INT NOT NULL ,
`progress_percentage` NUMERIC NOT NULL DEFAULT '0',
`completion_status` VARCHAR(255) NOT NULL DEFAULT 'not_started',
`time_spent` INT NOT NULL DEFAULT '0',
`last_accessed_at` DATETIME NULL ,
`completed_at` DATETIME NULL ,
`created_at` DATETIME NULL ,
`updated_at` DATETIME NULL 
);


CREATE TABLE `activity_logs` (
`id` INT NOT NULL ,
`user_id` INT NULL ,
`action` VARCHAR(255) NOT NULL ,
`description` TEXT NULL ,
`model_type` VARCHAR(255) NULL ,
`model_id` INT NULL ,
`ip_address` VARCHAR(255) NULL ,
`user_agent` TEXT NULL ,
`properties` TEXT NULL ,
`created_at` DATETIME NULL ,
`updated_at` DATETIME NULL 
);


CREATE TABLE `notifications` (
`id` INT NOT NULL ,
`user_id` INT NOT NULL ,
`type` VARCHAR(255) NOT NULL ,
`title` VARCHAR(255) NOT NULL ,
`message` TEXT NOT NULL ,
`data` TEXT NULL ,
`is_read` TINYINT(1) NOT NULL DEFAULT '0',
`read_at` DATETIME NULL ,
`created_at` DATETIME NULL ,
`updated_at` DATETIME NULL 
);


CREATE TABLE `certificates` (
`id` INT NOT NULL ,
`user_id` INT NOT NULL ,
`module_id` INT NOT NULL ,
`certificate_number` VARCHAR(255) NOT NULL ,
`user_name` VARCHAR(255) NOT NULL ,
`training_title` VARCHAR(255) NOT NULL ,
`score` INT NOT NULL DEFAULT '0',
`materials_completed` INT NOT NULL DEFAULT '0',
`hours` INT NOT NULL DEFAULT '0',
`issued_at` DATETIME NULL ,
`completed_at` DATETIME NULL ,
`instructor_name` VARCHAR(255) NULL ,
`status` VARCHAR(255) NOT NULL DEFAULT 'active',
`metadata` TEXT NULL ,
`created_at` DATETIME NULL ,
`updated_at` DATETIME NULL 
);

INSERT INTO `certificates` VALUES ('1', '1', '3', '3', '5', '5', 'CERT-202601-0003-005-9403', 'CERT-202601-0003-005-9403', 'Budi Santoso', 'Budi Santoso', 'Customer Service Excellence', 'Customer Service Excellence', '80', '80', '3', '3', '2', '2', '2026-01-05 06:57:19', '2026-01-05 06:57:19', '2026-01-05 06:57:19', '2026-01-05 06:57:19', 'Admin LMS', 'Admin LMS', 'active', 'active', '"{\"pretest_score\":80,\"posttest_score\":80,\"duration_minutes\":120}"', '"{\"pretest_score\":80,\"posttest_score\":80,\"duration_minutes\":120}"', '2026-01-05 06:57:19', '2026-01-05 06:57:19', '2026-01-05 06:57:19', '2026-01-05 06:57:19');
INSERT INTO `certificates` VALUES ('2', '2', '21', '21', '5', '5', 'CERT-202601-0021-005-184C', 'CERT-202601-0021-005-184C', 'Dian Permata', 'Dian Permata', 'Customer Service Excellence', 'Customer Service Excellence', '0', '0', '3', '3', '2', '2', '2026-01-07 02:12:14', '2026-01-07 02:12:14', '2026-01-07 02:12:14', '2026-01-07 02:12:14', 'Admin LMS', 'Admin LMS', 'active', 'active', '"{\"pretest_score\":null,\"posttest_score\":null,\"duration_minutes\":120}"', '"{\"pretest_score\":null,\"posttest_score\":null,\"duration_minutes\":120}"', '2026-01-07 02:12:15', '2026-01-07 02:12:15', '2026-01-07 02:12:15', '2026-01-07 02:12:15');

CREATE TABLE `learning_goals` (
`id` INT NOT NULL ,
`user_id` INT NOT NULL ,
`title` VARCHAR(255) NOT NULL ,
`description` TEXT NULL ,
`target_value` INT NOT NULL DEFAULT '1',
`current_progress` INT NOT NULL DEFAULT '0',
`unit` VARCHAR(255) NOT NULL DEFAULT 'courses',
`period` VARCHAR(255) NOT NULL DEFAULT 'weekly',
`status` VARCHAR(255) NOT NULL DEFAULT 'active',
`points` INT NOT NULL DEFAULT '100',
`start_date` DATE NULL ,
`end_date` DATE NULL ,
`completed_at` DATETIME NULL ,
`created_at` DATETIME NULL ,
`updated_at` DATETIME NULL 
);


CREATE TABLE `user_milestones` (
`id` INT NOT NULL ,
`user_id` INT NOT NULL ,
`key` VARCHAR(255) NOT NULL ,
`title` VARCHAR(255) NOT NULL ,
`description` TEXT NULL ,
`icon` VARCHAR(255) NULL ,
`points` INT NOT NULL DEFAULT '0',
`achieved` TINYINT(1) NOT NULL DEFAULT '0',
`achieved_at` DATETIME NULL ,
`created_at` DATETIME NULL ,
`updated_at` DATETIME NULL 
);


CREATE TABLE `milestone_definitions` (
`id` INT NOT NULL ,
`key` VARCHAR(255) NOT NULL ,
`title` VARCHAR(255) NOT NULL ,
`description` TEXT NULL ,
`icon` VARCHAR(255) NULL ,
`points` INT NOT NULL DEFAULT '100',
`requirement_type` VARCHAR(255) NOT NULL ,
`requirement_value` INT NOT NULL DEFAULT '1',
`order` INT NOT NULL DEFAULT '0',
`is_active` TINYINT(1) NOT NULL DEFAULT '1',
`created_at` DATETIME NULL ,
`updated_at` DATETIME NULL 
);


