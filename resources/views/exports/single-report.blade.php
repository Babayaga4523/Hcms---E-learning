<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $report['title'] }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #ffffff;
            color: #333333;
            line-height: 1.6;
        }
        
        .container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 30px;
            background-color: #ffffff;
        }
        
        /* Header BNI Style */
        .header {
            text-align: center;
            border-bottom: 3px solid #003399;
            padding-bottom: 30px;
            margin-bottom: 40px;
        }
        
        .header h1 {
            color: #003399;
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
        }
        
        .header .subtitle {
            color: #666666;
            font-size: 14px;
            margin-bottom: 20px;
        }
        
        .header .meta {
            font-size: 11px;
            color: #999999;
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            display: inline-block;
            border-left: 3px solid #003399;
        }
        
        .header .meta span {
            display: inline-block;
            margin-right: 30px;
        }
        
        .header .meta strong {
            color: #003399;
        }
        
        /* Content */
        .content {
            margin-bottom: 40px;
        }
        
        .section {
            margin-bottom: 30px;
        }
        
        .section-title {
            color: #003399;
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 20px;
            border-bottom: 2px solid #003399;
            padding-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .info-box {
            background: linear-gradient(135deg, #f8f9fa 0%, #f0f3f7 100%);
            padding: 20px;
            border-radius: 6px;
            border-left: 4px solid #003399;
            box-shadow: 0 1px 3px rgba(0, 51, 153, 0.1);
        }
        
        .info-box .label {
            font-size: 11px;
            color: #666666;
            text-transform: uppercase;
            font-weight: 700;
            margin-bottom: 8px;
            letter-spacing: 0.5px;
        }
        
        .info-box .value {
            font-size: 14px;
            color: #003399;
            font-weight: 600;
        }
        
        .info-box .subtext {
            font-size: 10px;
            color: #999999;
            margin-top: 5px;
        }
        
        /* Details Section */
        .details {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 6px;
            border-left: 4px solid #0066cc;
            margin-bottom: 20px;
        }
        
        .details-row {
            display: grid;
            grid-template-columns: 150px 1fr;
            margin-bottom: 12px;
            padding-bottom: 12px;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .details-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }
        
        .details-label {
            font-weight: 700;
            color: #003399;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .details-value {
            color: #555555;
            font-size: 12px;
        }
        
        /* Status Badge */
        .badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .badge-completed {
            background-color: #dbeafe;
            color: #0369a1;
        }
        
        .badge-pending {
            background-color: #fef3c7;
            color: #d97706;
        }
        
        .badge-official {
            background-color: #d1fae5;
            color: #047857;
        }
        
        /* Footer */
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #e0e0e0;
            text-align: center;
            font-size: 10px;
            color: #999999;
        }
        
        .footer-text {
            margin-bottom: 8px;
            line-height: 1.6;
        }
        
        .footer-divider {
            height: 1px;
            background-color: #e0e0e0;
            margin: 15px 0;
        }
        
        /* Signature Area */
        .signature-area {
            margin-top: 40px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
        }
        
        .signature-box {
            text-align: center;
            font-size: 10px;
        }
        
        .signature-line {
            border-bottom: 1px solid #333333;
            margin-bottom: 5px;
            height: 40px;
        }
        
        .signature-label {
            font-weight: 700;
            color: #003399;
            text-transform: uppercase;
        }
        
        /* Print Styles */
        @media print {
            body {
                margin: 0;
                padding: 0;
            }
            
            .container {
                padding: 0;
                max-width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>{{ $report['title'] }}</h1>
            <p class="subtitle">Laporan {{ $report['type'] }} - Sistem HCMS E-Learning</p>
            <div class="meta">
                <span><strong>Tanggal:</strong> {{ $report['date'] }}</span>
                <span><strong>Dibuat:</strong> {{ $generatedAt }}</span>
                <span><strong>Organisasi:</strong> {{ $company }}</span>
            </div>
        </div>
        
        <!-- Content -->
        <div class="content">
            <!-- Overview Section -->
            <div class="section">
                <h2 class="section-title">Ringkasan Laporan</h2>
                
                <div class="info-grid">
                    <div class="info-box">
                        <div class="label">Tipe Laporan</div>
                        <div class="value">{{ $report['type'] }}</div>
                        <div class="subtext">Kategori: Laporan Resmi</div>
                    </div>
                    <div class="info-box">
                        <div class="label">Periode</div>
                        <div class="value">{{ $report['date'] }}</div>
                        <div class="subtext">Tanggal Laporan</div>
                    </div>
                    <div class="info-box">
                        <div class="label">Status</div>
                        <div class="value"><span class="badge badge-completed">SELESAI</span></div>
                        <div class="subtext">Siap untuk Distribusi</div>
                    </div>
                    <div class="info-box">
                        <div class="label">Nomor Dokumen</div>
                        <div class="value">RPT-{{ date('Ym') }}-001</div>
                        <div class="subtext">Referensi Dokumen</div>
                    </div>
                </div>
            </div>
            
            <!-- Details Section -->
            <div class="section">
                <h2 class="section-title">Detail Laporan</h2>
                
                <div class="details">
                    <div class="details-row">
                        <div class="details-label">Judul Laporan</div>
                        <div class="details-value">{{ $report['title'] }}</div>
                    </div>
                    <div class="details-row">
                        <div class="details-label">Jenis Laporan</div>
                        <div class="details-value">{{ $report['type'] }}</div>
                    </div>
                    <div class="details-row">
                        <div class="details-label">Periode</div>
                        <div class="details-value">{{ $report['date'] }}</div>
                    </div>
                    <div class="details-row">
                        <div class="details-label">Dibuat Oleh</div>
                        <div class="details-value">Admin Dashboard System</div>
                    </div>
                    <div class="details-row">
                        <div class="details-label">Tanggal Pembuatan</div>
                        <div class="details-value">{{ $generatedAt }}</div>
                    </div>
                    <div class="details-row">
                        <div class="details-label">Organisasi</div>
                        <div class="details-value">{{ $company }}</div>
                    </div>
                </div>
            </div>
            
            <!-- Description -->
            <div class="section">
                <h2 class="section-title">Deskripsi & Catatan</h2>
                <p style="font-size: 12px; color: #555555; line-height: 1.8; margin-bottom: 15px;">
                    Laporan {{ $report['type'] }} ini berisi informasi lengkap dan menyeluruh mengenai sistem HCMS E-Learning. 
                    Seluruh data yang disajikan telah diverifikasi dan divalidasi untuk memastikan akurasi maksimal.
                </p>
                <p style="font-size: 12px; color: #555555; line-height: 1.8;">
                    Dokumen ini ditujukan untuk keperluan internal organisasi dan pengambilan keputusan strategis yang berbasis data. 
                    Informasi yang terdapat di dalamnya bersifat konfidensial dan hanya boleh didistribusikan kepada pihak-pihak yang berwenang.
                </p>
            </div>
        </div>
        
        <!-- Signature Area -->
        <div class="signature-area">
            <div class="signature-box">
                <div class="signature-line"></div>
                <div class="signature-label">Admin System</div>
                <div style="font-size: 9px; color: #999999; margin-top: 3px;">Tanggal & Tanda Tangan</div>
            </div>
            <div class="signature-box">
                <div class="signature-line"></div>
                <div class="signature-label">Pejabat yang Berwenang</div>
                <div style="font-size: 9px; color: #999999; margin-top: 3px;">Tanggal & Tanda Tangan</div>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <div class="footer-divider"></div>
            <div class="footer-text">
                Dokumen ini adalah laporan otomatis yang dihasilkan oleh Sistem HCMS E-Learning.
            </div>
            <div class="footer-text">
                Hak Cipta © {{ date('Y') }} {{ $company }}. Semua Hak Dilindungi Undang-Undang.
            </div>
            <div class="footer-text" style="margin-top: 10px; font-style: italic;">
                Catatan: Laporan ini bersifat Konfidensial. Penggunaan tanpa izin adalah tindakan ilegal.
            </div>
        </div>
    </div>
</body>
</html>
