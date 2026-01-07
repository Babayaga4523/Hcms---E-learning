<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laporan Pembelajaran - {{ $user->name }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 12px;
            line-height: 1.5;
            color: #1a202c;
            background: #fff;
        }
        
        .container {
            padding: 30px;
        }
        
        /* Header */
        .header {
            text-align: center;
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        .header h1 {
            font-size: 24px;
            color: #1e40af;
            margin-bottom: 5px;
        }
        
        .header p {
            color: #64748b;
            font-size: 11px;
        }
        
        .user-info {
            background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 25px;
        }
        
        .user-info h2 {
            font-size: 18px;
            margin-bottom: 5px;
        }
        
        .user-info p {
            opacity: 0.9;
            font-size: 11px;
        }
        
        /* Stats Grid */
        .stats-grid {
            display: table;
            width: 100%;
            margin-bottom: 25px;
        }
        
        .stats-row {
            display: table-row;
        }
        
        .stat-card {
            display: table-cell;
            width: 25%;
            padding: 15px;
            text-align: center;
            border: 1px solid #e2e8f0;
            background: #f8fafc;
        }
        
        .stat-card .value {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
        }
        
        .stat-card .label {
            font-size: 10px;
            color: #64748b;
            text-transform: uppercase;
        }
        
        /* Section */
        .section {
            margin-bottom: 25px;
        }
        
        .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #1e40af;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 8px;
            margin-bottom: 15px;
        }
        
        /* Table */
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
        }
        
        table th {
            background: #3b82f6;
            color: white;
            padding: 10px 8px;
            text-align: left;
            font-weight: 600;
        }
        
        table td {
            padding: 10px 8px;
            border-bottom: 1px solid #e2e8f0;
        }
        
        table tr:nth-child(even) {
            background: #f8fafc;
        }
        
        /* Progress Bar */
        .progress-bar {
            width: 100%;
            height: 8px;
            background: #e2e8f0;
            border-radius: 4px;
            overflow: hidden;
        }
        
        .progress-fill {
            height: 100%;
            background: #10b981;
            border-radius: 4px;
        }
        
        /* Badge */
        .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: bold;
        }
        
        .badge-success {
            background: #d1fae5;
            color: #065f46;
        }
        
        .badge-danger {
            background: #fee2e2;
            color: #991b1b;
        }
        
        .badge-warning {
            background: #fef3c7;
            color: #92400e;
        }
        
        .badge-info {
            background: #dbeafe;
            color: #1e40af;
        }
        
        /* Score Colors */
        .score-passed {
            font-weight: bold;
            color: #065f46;
        }
        
        .score-failed {
            font-weight: bold;
            color: #991b1b;
        }
        
        .progress-container {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .progress-bar-wrapper {
            flex: 1;
        }
        
        /* Certificate Card */
        .certificate-card {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border: 1px solid #f59e0b;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 10px;
        }
        
        .certificate-card h4 {
            color: #92400e;
            font-size: 12px;
            margin-bottom: 3px;
        }
        
        .certificate-card p {
            color: #a16207;
            font-size: 10px;
        }
        
        /* Footer */
        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #94a3b8;
            font-size: 10px;
        }
        
        /* Achievement */
        .achievement-box {
            background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            margin-top: 20px;
        }
        
        .achievement-box h3 {
            font-size: 16px;
            margin-bottom: 5px;
        }
        
        .achievement-box p {
            opacity: 0.9;
            font-size: 11px;
        }
        
        .points {
            font-size: 28px;
            font-weight: bold;
            color: #fbbf24;
        }
        
        /* Empty State */
        .empty-state {
            text-align: center;
            padding: 20px;
            color: #94a3b8;
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>📚 Laporan Pembelajaran</h1>
            <p>Digenerate pada {{ $generated_at }}</p>
        </div>
        
        <!-- User Info -->
        <div class="user-info">
            <h2>{{ $user->name }}</h2>
            <p>{{ $user->email }} | {{ $user->department ?? 'General' }}</p>
        </div>
        
        <!-- Stats -->
        <div class="stats-grid">
            <div class="stats-row">
                <div class="stat-card">
                    <div class="value">{{ $stats['completed_trainings'] }}/{{ $stats['total_trainings'] }}</div>
                    <div class="label">Training Selesai</div>
                </div>
                <div class="stat-card">
                    <div class="value">{{ $stats['average_score'] }}</div>
                    <div class="label">Rata-rata Nilai</div>
                </div>
                <div class="stat-card">
                    <div class="value">{{ $stats['total_learning_hours'] }}</div>
                    <div class="label">Jam Belajar</div>
                </div>
                <div class="stat-card">
                    <div class="value">{{ $stats['total_certificates'] }}</div>
                    <div class="label">Sertifikat</div>
                </div>
            </div>
        </div>
        
        <!-- Training Progress -->
        <div class="section">
            <h3 class="section-title">📖 Progress Training</h3>
            @if(count($trainings) > 0)
            <table>
                <thead>
                    <tr>
                        <th style="width: 40%">Nama Training</th>
                        <th style="width: 20%">Progress</th>
                        <th style="width: 20%">Status</th>
                        <th style="width: 20%">Waktu Belajar</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($trainings as $training)
                    <tr>
                        <td>{{ $training['title'] }}</td>
                        <td>
                            <div class="progress-container">
                                <div class="progress-bar progress-bar-wrapper">
                                    @php $progressWidth = $training['progress'] ?? 0; @endphp
                                    <div class="progress-fill" style="width: <?php echo $progressWidth; ?>%;"></div>
                                </div>
                                <span>{{ $training['progress'] }}%</span>
                            </div>
                        </td>
                        <td>
                            @if($training['status'] === 'completed')
                                <span class="badge badge-success">Selesai</span>
                            @elseif($training['status'] === 'in_progress')
                                <span class="badge badge-info">Berlangsung</span>
                            @else
                                <span class="badge badge-warning">Belum Mulai</span>
                            @endif
                        </td>
                        <td>{{ $training['time_spent'] }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
            @else
            <div class="empty-state">Belum ada training yang diikuti</div>
            @endif
        </div>
        
        <!-- Quiz Results -->
        <div class="section">
            <h3 class="section-title">📝 Hasil Quiz</h3>
            @if(count($quizzes) > 0)
            <table>
                <thead>
                    <tr>
                        <th style="width: 35%">Training</th>
                        <th style="width: 15%">Tipe</th>
                        <th style="width: 15%">Nilai</th>
                        <th style="width: 15%">Status</th>
                        <th style="width: 20%">Tanggal</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($quizzes as $quiz)
                    <tr>
                        <td>{{ $quiz['training_title'] }}</td>
                        <td>
                            @if($quiz['type'] === 'pretest' || $quiz['type'] === 'pre_test')
                                <span class="badge badge-info">Pre-Test</span>
                            @else
                                <span class="badge badge-warning">Post-Test</span>
                            @endif
                        </td>
                        <td class="{{ $quiz['is_passed'] ? 'score-passed' : 'score-failed' }}">
                            {{ $quiz['score'] }}
                        </td>
                        <td>
                            @if($quiz['is_passed'])
                                <span class="badge badge-success">LULUS</span>
                            @else
                                <span class="badge badge-danger">TIDAK LULUS</span>
                            @endif
                        </td>
                        <td>
                            @if($quiz['completed_at'])
                                {{ \Carbon\Carbon::parse($quiz['completed_at'])->format('d M Y') }}
                            @else
                                -
                            @endif
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
            @else
            <div class="empty-state">Belum ada quiz yang dikerjakan</div>
            @endif
        </div>
        
        <!-- Certificates -->
        <div class="section">
            <h3 class="section-title">🏆 Sertifikat</h3>
            @if(count($certificates) > 0)
                @foreach($certificates as $cert)
                <div class="certificate-card">
                    <h4>{{ $cert['training_title'] }}</h4>
                    <p>
                        Diperoleh: {{ \Carbon\Carbon::parse($cert['issued_at'])->format('d F Y') }}
                        @if($cert['score'])
                            | Nilai: {{ $cert['score'] }}
                        @endif
                    </p>
                </div>
                @endforeach
            @else
            <div class="empty-state">Belum ada sertifikat yang diperoleh</div>
            @endif
        </div>
        
        <!-- Achievement -->
        <div class="achievement-box">
            <h3>🌟 Total Poin</h3>
            <div class="points">{{ number_format($stats['points_earned']) }}</div>
            <p>Terus tingkatkan pembelajaran Anda!</p>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p>Laporan ini digenerate otomatis oleh Sistem E-Learning</p>
            <p>© {{ date('Y') }} - BNI Corporate University</p>
        </div>
    </div>
</body>
</html>
