<?php
require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Module;

echo "=== Creating Training Materials ===\n\n";

// Update module 5 with material URLs
$module = Module::find(5);

if (!$module) {
    echo "❌ Module 5 not found!\n";
    exit(1);
}

echo "📚 Module: {$module->title}\n\n";

// Create materials directory if not exists
$materialsPath = public_path('materials/5');
if (!file_exists($materialsPath)) {
    mkdir($materialsPath, 0755, true);
}

// Create a simple HTML file as "video" placeholder (since we can't create actual video)
$videoContent = <<<HTML
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Video: Customer Service Excellence</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; margin: 0; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
        h1 { color: #1e40af; margin-bottom: 20px; }
        .video-placeholder { background: #1e293b; color: white; padding: 100px 20px; text-align: center; border-radius: 10px; margin: 20px 0; }
        .video-placeholder svg { width: 80px; height: 80px; margin-bottom: 20px; }
        .content { line-height: 1.8; color: #334155; }
        .chapter { background: #f1f5f9; padding: 15px 20px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #3b82f6; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎬 Video Pembelajaran: Customer Service Excellence</h1>
        
        <div class="video-placeholder">
            <svg fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            <h2>Video Training</h2>
            <p>Durasi: 30 menit</p>
        </div>
        
        <div class="content">
            <h2>📋 Daftar Isi Video:</h2>
            
            <div class="chapter">
                <strong>Bab 1: Pengenalan Customer Service Excellence (0:00 - 5:00)</strong>
                <p>Memahami konsep dasar pelayanan pelanggan yang excellent</p>
            </div>
            
            <div class="chapter">
                <strong>Bab 2: Prinsip Dasar Pelayanan (5:00 - 12:00)</strong>
                <p>Empati, Responsivitas, Profesionalisme, dan Komunikasi Efektif</p>
            </div>
            
            <div class="chapter">
                <strong>Bab 3: Menangani Pelanggan yang Sulit (12:00 - 20:00)</strong>
                <p>Teknik active listening dan de-escalation</p>
            </div>
            
            <div class="chapter">
                <strong>Bab 4: Service Recovery (20:00 - 25:00)</strong>
                <p>Cara menangani komplain dan memulihkan kepuasan pelanggan</p>
            </div>
            
            <div class="chapter">
                <strong>Bab 5: Kesimpulan dan Tips (25:00 - 30:00)</strong>
                <p>Rangkuman dan tips praktis untuk diterapkan sehari-hari</p>
            </div>
        </div>
    </div>
</body>
</html>
HTML;

file_put_contents($materialsPath . '/video-training.html', $videoContent);
echo "✅ Created: video-training.html\n";

// Create PDF-style HTML document
$documentContent = <<<HTML
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Dokumen: Customer Service Excellence</title>
    <style>
        body { font-family: 'Georgia', serif; padding: 40px; background: #f8fafc; margin: 0; }
        .document { max-width: 800px; margin: 0 auto; background: white; padding: 60px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        h1 { color: #1e3a5f; text-align: center; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; }
        h2 { color: #1e40af; margin-top: 30px; }
        h3 { color: #3b82f6; }
        p { line-height: 1.8; color: #334155; text-align: justify; }
        .header { text-align: center; margin-bottom: 40px; }
        .logo { font-size: 48px; }
        ul { line-height: 2; }
        li { margin: 10px 0; }
        .highlight { background: #dbeafe; padding: 20px; border-radius: 10px; margin: 20px 0; }
        .important { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
        .footer { text-align: center; margin-top: 50px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
        th { background: #3b82f6; color: white; }
    </style>
</head>
<body>
    <div class="document">
        <div class="header">
            <div class="logo">📘</div>
            <h1>CUSTOMER SERVICE EXCELLENCE</h1>
            <p><strong>Panduan Lengkap Pelayanan Pelanggan</strong></p>
            <p>HCMS E-Learning - BNI Training</p>
        </div>
        
        <h2>1. Pendahuluan</h2>
        <p>Customer Service Excellence adalah pendekatan komprehensif dalam memberikan layanan yang melampaui ekspektasi pelanggan secara konsisten. Program pelatihan ini dirancang untuk membekali peserta dengan pengetahuan dan keterampilan yang diperlukan untuk memberikan layanan pelanggan yang luar biasa.</p>
        
        <div class="highlight">
            <strong>🎯 Tujuan Pembelajaran:</strong>
            <ul>
                <li>Memahami konsep customer service excellence</li>
                <li>Menguasai teknik komunikasi efektif</li>
                <li>Mampu menangani keluhan pelanggan dengan profesional</li>
                <li>Menerapkan service recovery yang excellent</li>
            </ul>
        </div>
        
        <h2>2. Prinsip Dasar Customer Service</h2>
        
        <h3>2.1 Empati</h3>
        <p>Empati adalah kemampuan untuk memahami dan merasakan apa yang dirasakan pelanggan. Dengan empati, kita dapat memberikan solusi yang tepat dan membuat pelanggan merasa dihargai.</p>
        
        <h3>2.2 Responsivitas</h3>
        <p>Kecepatan dalam merespon kebutuhan pelanggan menunjukkan bahwa kita menghargai waktu mereka. Responsivitas yang baik meningkatkan kepuasan dan loyalitas pelanggan.</p>
        
        <h3>2.3 Profesionalisme</h3>
        <p>Sikap profesional mencakup penampilan, bahasa tubuh, dan cara berkomunikasi yang mencerminkan kompetensi dan dapat dipercaya.</p>
        
        <div class="important">
            <strong>⚠️ Ingat!</strong><br>
            "Pelanggan mungkin tidak selalu benar, tapi mereka selalu penting."
        </div>
        
        <h2>3. Teknik Active Listening</h2>
        <table>
            <tr>
                <th>Teknik</th>
                <th>Deskripsi</th>
                <th>Contoh</th>
            </tr>
            <tr>
                <td>Parafrase</td>
                <td>Mengulang inti pembicaraan dengan kata-kata sendiri</td>
                <td>"Jadi Bapak mengalami kendala saat login, ya?"</td>
            </tr>
            <tr>
                <td>Klarifikasi</td>
                <td>Meminta penjelasan lebih lanjut</td>
                <td>"Bisa dijelaskan lebih detail error yang muncul?"</td>
            </tr>
            <tr>
                <td>Refleksi</td>
                <td>Merefleksikan perasaan pelanggan</td>
                <td>"Saya memahami Ibu merasa frustasi dengan situasi ini."</td>
            </tr>
        </table>
        
        <h2>4. Menangani Pelanggan yang Marah</h2>
        <p>Berikut adalah langkah-langkah LEARN dalam menangani pelanggan yang marah:</p>
        <ul>
            <li><strong>L</strong>isten - Dengarkan dengan penuh perhatian</li>
            <li><strong>E</strong>mpathize - Tunjukkan empati</li>
            <li><strong>A</strong>pologize - Minta maaf dengan tulus</li>
            <li><strong>R</strong>esolve - Selesaikan masalah</li>
            <li><strong>N</strong>otify - Informasikan perkembangan</li>
        </ul>
        
        <h2>5. Service Recovery Excellence</h2>
        <p>Service recovery adalah proses memperbaiki pengalaman negatif pelanggan menjadi positif. Service recovery yang excellent dapat mengubah pelanggan yang kecewa menjadi pelanggan loyal.</p>
        
        <div class="highlight">
            <strong>📊 Statistik Penting:</strong>
            <ul>
                <li>95% pelanggan akan kembali jika masalah diselesaikan dengan cepat</li>
                <li>Pelanggan yang pulih dari pengalaman buruk 30% lebih loyal</li>
                <li>70% pelanggan yang komplain akan berbisnis lagi jika didengarkan</li>
            </ul>
        </div>
        
        <h2>6. Kesimpulan</h2>
        <p>Customer Service Excellence bukan hanya tentang menyelesaikan masalah, tetapi tentang menciptakan pengalaman positif yang berkesan. Dengan menerapkan prinsip-prinsip dan teknik yang telah dipelajari, kita dapat meningkatkan kepuasan pelanggan dan membangun loyalitas jangka panjang.</p>
        
        <div class="footer">
            <p>© 2026 HCMS E-Learning - BNI Training<br>
            Dokumen ini adalah materi pelatihan resmi</p>
        </div>
    </div>
</body>
</html>
HTML;

file_put_contents($materialsPath . '/dokumen-pembelajaran.html', $documentContent);
echo "✅ Created: dokumen-pembelajaran.html\n";

// Create Presentation-style HTML
$presentationContent = <<<HTML
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Presentasi: Customer Service Excellence</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 0; background: #0f172a; }
        .slide { min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 40px; box-sizing: border-box; }
        .slide:nth-child(odd) { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); }
        .slide:nth-child(even) { background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%); }
        .content { max-width: 900px; text-align: center; color: white; }
        h1 { font-size: 3em; margin-bottom: 20px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
        h2 { font-size: 2.5em; margin-bottom: 30px; }
        p { font-size: 1.5em; line-height: 1.6; margin: 15px 0; }
        .icon { font-size: 80px; margin-bottom: 20px; }
        .list { text-align: left; font-size: 1.3em; }
        .list li { margin: 20px 0; padding-left: 20px; }
        .slide-number { position: absolute; bottom: 20px; right: 30px; font-size: 1.2em; opacity: 0.7; }
        .card-container { display: flex; gap: 20px; flex-wrap: wrap; justify-content: center; margin-top: 30px; }
        .card { background: rgba(255,255,255,0.2); padding: 30px; border-radius: 15px; width: 200px; }
        .card h3 { margin: 10px 0; }
        .divider { width: 100px; height: 4px; background: rgba(255,255,255,0.5); margin: 20px auto; border-radius: 2px; }
        .quote { font-style: italic; font-size: 1.8em; max-width: 700px; margin: 30px 0; }
        .footer { margin-top: 30px; opacity: 0.8; }
    </style>
</head>
<body>
    <!-- Slide 1: Title -->
    <div class="slide">
        <div class="content">
            <div class="icon">🎯</div>
            <h1>CUSTOMER SERVICE EXCELLENCE</h1>
            <div class="divider"></div>
            <p>Membangun Pelayanan Pelanggan yang Luar Biasa</p>
            <p class="footer">HCMS E-Learning | BNI Training | 2026</p>
        </div>
        <div class="slide-number">1 / 8</div>
    </div>
    
    <!-- Slide 2: Objectives -->
    <div class="slide">
        <div class="content">
            <h2>📋 Tujuan Pembelajaran</h2>
            <ul class="list">
                <li>✅ Memahami konsep Customer Service Excellence</li>
                <li>✅ Menguasai teknik komunikasi efektif dengan pelanggan</li>
                <li>✅ Mampu menangani keluhan pelanggan secara profesional</li>
                <li>✅ Menerapkan service recovery yang excellent</li>
            </ul>
        </div>
        <div class="slide-number">2 / 8</div>
    </div>
    
    <!-- Slide 3: 4 Pillars -->
    <div class="slide">
        <div class="content">
            <h2>🏛️ 4 Pilar Customer Service Excellence</h2>
            <div class="card-container">
                <div class="card">
                    <div class="icon">💙</div>
                    <h3>Empati</h3>
                </div>
                <div class="card">
                    <div class="icon">⚡</div>
                    <h3>Responsif</h3>
                </div>
                <div class="card">
                    <div class="icon">👔</div>
                    <h3>Profesional</h3>
                </div>
                <div class="card">
                    <div class="icon">💬</div>
                    <h3>Komunikatif</h3>
                </div>
            </div>
        </div>
        <div class="slide-number">3 / 8</div>
    </div>
    
    <!-- Slide 4: Active Listening -->
    <div class="slide">
        <div class="content">
            <h2>👂 Teknik Active Listening</h2>
            <div class="card-container">
                <div class="card">
                    <h3>Parafrase</h3>
                    <p>Ulangi inti pembicaraan</p>
                </div>
                <div class="card">
                    <h3>Klarifikasi</h3>
                    <p>Minta penjelasan detail</p>
                </div>
                <div class="card">
                    <h3>Refleksi</h3>
                    <p>Refleksikan perasaan</p>
                </div>
            </div>
        </div>
        <div class="slide-number">4 / 8</div>
    </div>
    
    <!-- Slide 5: LEARN Method -->
    <div class="slide">
        <div class="content">
            <h2>📚 Metode LEARN</h2>
            <ul class="list">
                <li><strong>L</strong>isten - Dengarkan dengan penuh perhatian</li>
                <li><strong>E</strong>mpathize - Tunjukkan empati</li>
                <li><strong>A</strong>pologize - Minta maaf dengan tulus</li>
                <li><strong>R</strong>esolve - Selesaikan masalah</li>
                <li><strong>N</strong>otify - Informasikan perkembangan</li>
            </ul>
        </div>
        <div class="slide-number">5 / 8</div>
    </div>
    
    <!-- Slide 6: Statistics -->
    <div class="slide">
        <div class="content">
            <h2>📊 Fakta Penting</h2>
            <div class="card-container">
                <div class="card">
                    <div style="font-size: 48px; font-weight: bold;">95%</div>
                    <p>Pelanggan kembali jika masalah diselesaikan cepat</p>
                </div>
                <div class="card">
                    <div style="font-size: 48px; font-weight: bold;">70%</div>
                    <p>Pelanggan loyal jika komplain ditangani baik</p>
                </div>
                <div class="card">
                    <div style="font-size: 48px; font-weight: bold;">30%</div>
                    <p>Peningkatan loyalitas setelah service recovery</p>
                </div>
            </div>
        </div>
        <div class="slide-number">6 / 8</div>
    </div>
    
    <!-- Slide 7: Quote -->
    <div class="slide">
        <div class="content">
            <div class="icon">💡</div>
            <p class="quote">"Pelanggan mungkin tidak selalu benar, tapi mereka selalu penting."</p>
            <div class="divider"></div>
            <p>- Prinsip Customer Service Excellence -</p>
        </div>
        <div class="slide-number">7 / 8</div>
    </div>
    
    <!-- Slide 8: Thank You -->
    <div class="slide">
        <div class="content">
            <div class="icon">🎉</div>
            <h1>Terima Kasih!</h1>
            <div class="divider"></div>
            <p>Selamat menerapkan Customer Service Excellence</p>
            <p>dalam pekerjaan sehari-hari</p>
            <p class="footer">© 2026 HCMS E-Learning - BNI Training</p>
        </div>
        <div class="slide-number">8 / 8</div>
    </div>
</body>
</html>
HTML;

file_put_contents($materialsPath . '/presentasi.html', $presentationContent);
echo "✅ Created: presentasi.html\n";

// Update module with URLs
$module->video_url = '/materials/5/video-training.html';
$module->document_url = '/materials/5/dokumen-pembelajaran.html';
$module->presentation_url = '/materials/5/presentasi.html';
$module->save();

echo "\n✅ Module updated with material URLs!\n\n";

echo "📁 Materials created:\n";
echo "   1. 🎬 Video: /materials/5/video-training.html\n";
echo "   2. 📄 Dokumen: /materials/5/dokumen-pembelajaran.html\n";
echo "   3. 📊 Presentasi: /materials/5/presentasi.html\n";

echo "\n💡 Access: http://localhost:8000/training/5\n";
echo "   Materials will now show 3 items instead of 1!\n";
