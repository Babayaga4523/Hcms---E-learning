<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title }}</title>
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
            padding: 20px;
            background-color: #ffffff;
        }
        
        /* Header BNI Style */
        .header {
            border-bottom: 3px solid #003399;
            padding-bottom: 20px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }
        
        .header-left h1 {
            color: #003399;
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 5px;
        }
        
        .header-left p {
            color: #666666;
            font-size: 12px;
            margin-bottom: 10px;
        }
        
        .header-right {
            text-align: right;
            font-size: 10px;
            color: #999999;
        }
        
        .header-right strong {
            color: #333333;
        }
        
        /* Company Info */
        .company-info {
            background-color: #f8f9fa;
            border-left: 4px solid #003399;
            padding: 15px;
            margin-bottom: 30px;
            border-radius: 4px;
        }
        
        .company-info p {
            font-size: 11px;
            margin-bottom: 5px;
            color: #555555;
        }
        
        .company-info strong {
            color: #003399;
        }
        
        /* Content Section */
        .content {
            margin-bottom: 30px;
        }
        
        .section-title {
            color: #003399;
            font-size: 14px;
            font-weight: 700;
            margin-top: 25px;
            margin-bottom: 15px;
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .info-item {
            background-color: #f8f9fa;
            padding: 12px;
            border-radius: 4px;
            border-left: 3px solid #003399;
        }
        
        .info-label {
            font-size: 10px;
            color: #666666;
            text-transform: uppercase;
            font-weight: 600;
            margin-bottom: 5px;
        }
        
        .info-value {
            font-size: 13px;
            color: #333333;
            font-weight: 500;
        }
        
        /* Table Styles */
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            background-color: #ffffff;
        }
        
        table thead {
            background-color: #003399;
            color: #ffffff;
        }
        
        table th {
            padding: 12px 10px;
            text-align: left;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #003399;
        }
        
        table td {
            padding: 10px;
            font-size: 10px;
            color: #555555;
            border-bottom: 1px solid #e0e0e0;
        }
        
        table tbody tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        
        table tbody tr:hover {
            background-color: #f0f4ff;
        }
        
        .text-center {
            text-align: center;
        }
        
        .text-right {
            text-align: right;
        }
        
        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .badge-active {
            background-color: #d1fae5;
            color: #047857;
        }
        
        .badge-inactive {
            background-color: #fee2e2;
            color: #dc2626;
        }
        
        .badge-pending {
            background-color: #fef3c7;
            color: #d97706;
        }
        
        .badge-completed {
            background-color: #dbeafe;
            color: #0369a1;
        }
        
        /* Footer */
        .footer {
            margin-top: 40px;
            padding-top: 15px;
            border-top: 2px solid #e0e0e0;
            font-size: 9px;
            color: #999999;
            text-align: center;
        }
        
        .footer-divider {
            height: 1px;
            background-color: #e0e0e0;
            margin: 15px 0;
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
            
            .page-break {
                page-break-after: always;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="header-left">
                <h1>{{ $report['title'] }}</h1>
                <p>Laporan {{ $report['type'] }} Sistem E-Learning</p>
            </div>
            <div class="header-right">
                <div><strong>Tanggal Laporan:</strong><br>{{ $report['date'] }}</div>
                <div style="margin-top: 10px;"><strong>Dibuat pada:</strong><br>{{ $generatedAt }}</div>
            </div>
        </div>
        
        <!-- Company Info -->
        <div class="company-info">
            <p><strong>Organisasi:</strong> {{ $company }}</p>
            <p><strong>Sistem:</strong> HCMS E-Learning Platform</p>
            <p><strong>Jenis Laporan:</strong> {{ $report['type'] }}</p>
            <p><strong>Status:</strong> <span class="badge badge-completed">Official Report</span></p>
        </div>
        
        <!-- Content -->
        <div class="content">
            <div class="section-title">Informasi Laporan</div>
            
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Tipe Laporan</div>
                    <div class="info-value">{{ $report['type'] }}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Periode Laporan</div>
                    <div class="info-value">{{ $report['date'] }}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Tanggal Pembuatan</div>
                    <div class="info-value">{{ $generatedAt }}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Nomor Dokumen</div>
                    <div class="info-value">RPT-{{ date('Ym') }}-{{ str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT) }}</div>
                </div>
            </div>
            
            <div class="section-title">Deskripsi</div>
            <p style="font-size: 11px; color: #666; line-height: 1.8;">
                Laporan ini berisi informasi lengkap mengenai {{ strtolower($report['type']) }} dalam sistem HCMS E-Learning. 
                Data yang disajikan telah diverifikasi dan akurat hingga tanggal pembuatan laporan. 
                Laporan ini dimaksudkan untuk keperluan internal dan pengambilan keputusan strategis.
            </p>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <div class="footer-divider"></div>
            <p>Dokumen ini adalah laporan otomatis yang dihasilkan oleh Sistem HCMS E-Learning</p>
            <p>Hak Cipta © {{ date('Y') }} {{ $company }}. Semua Hak Dilindungi Undang-Undang.</p>
            <p style="margin-top: 10px; font-style: italic;">Catatan: Laporan ini bersifat Konfidensial dan hanya untuk penggunaan penerima yang ditunjuk.</p>
        </div>
    </div>
</body>
</html>
