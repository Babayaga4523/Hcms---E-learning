<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Compliance Report</title>
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
            padding: 15px;
            background-color: #ffffff;
        }
        
        .header {
            border-bottom: 3px solid #003399;
            padding-bottom: 15px;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .header h1 {
            color: #003399;
            font-size: 22px;
            font-weight: 700;
            margin-bottom: 5px;
        }
        
        .header p {
            color: #666666;
            font-size: 11px;
            margin-bottom: 8px;
        }
        
        .meta-info {
            background-color: #f8f9fa;
            border-left: 4px solid #003399;
            padding: 10px;
            margin-bottom: 15px;
            font-size: 10px;
            color: #666666;
        }
        
        .meta-info strong {
            color: #003399;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 10px;
        }
        
        table thead {
            background-color: #003399;
            color: white;
        }
        
        table th {
            padding: 8px;
            text-align: left;
            font-weight: 700;
            border: 1px solid #003399;
        }
        
        table td {
            padding: 7px;
            border: 1px solid #e0e0e0;
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
            padding: 3px 6px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: 600;
            text-align: center;
        }
        
        .badge-active {
            background-color: #d1fae5;
            color: #047857;
        }
        
        .badge-inactive {
            background-color: #fee2e2;
            color: #dc2626;
        }
        
        .badge-high {
            background-color: #d1fae5;
            color: #047857;
        }
        
        .badge-medium {
            background-color: #fef3c7;
            color: #d97706;
        }
        
        .badge-low {
            background-color: #fee2e2;
            color: #dc2626;
        }
        
        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 2px solid #e0e0e0;
            font-size: 9px;
            color: #999999;
            text-align: center;
        }
        
        .page-break {
            page-break-after: always;
        }
        
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
            <h1>Compliance & Training Report</h1>
            <p>Laporan Kepatuhan dan Pelatihan Sistem E-Learning</p>
        </div>
        
        <!-- Meta Info -->
        <div class="meta-info">
            <strong>Generated:</strong> {{ $generatedAt }} | 
            <strong>Organization:</strong> {{ $company }} | 
            <strong>Total Records:</strong> {{ count($data) }}
        </div>
        
        <!-- Table -->
        <table>
            <thead>
                <tr>
                    <th style="width: 4%;">No</th>
                    <th style="width: 15%;">Name</th>
                    <th style="width: 18%;">Email</th>
                    <th style="width: 10%;">Role</th>
                    <th style="width: 10%;">Status</th>
                    <th style="width: 8%;" class="text-center">Total</th>
                    <th style="width: 8%;" class="text-center">Done</th>
                    <th style="width: 10%;" class="text-center">Compliance %</th>
                    <th style="width: 12%;" class="text-center">Created</th>
                </tr>
            </thead>
            <tbody>
                @forelse($data as $index => $item)
                    <tr>
                        <td class="text-center">{{ $index + 1 }}</td>
                        <td>{{ $item['name'] ?? '-' }}</td>
                        <td>{{ $item['email'] ?? '-' }}</td>
                        <td>{{ ucfirst($item['role'] ?? '-') }}</td>
                        <td class="text-center">
                            <span class="badge badge-{{ $item['status'] === 'active' ? 'active' : 'inactive' }}">
                                {{ ucfirst($item['status'] ?? '-') }}
                            </span>
                        </td>
                        <td class="text-center">{{ $item['total_trainings'] ?? 0 }}</td>
                        <td class="text-center">{{ $item['completed_trainings'] ?? 0 }}</td>
                        <td class="text-center">
                            <span class="badge badge-{{ $item['compliance_rate'] >= 80 ? 'high' : ($item['compliance_rate'] >= 60 ? 'medium' : 'low') }}">
                                {{ round($item['compliance_rate'] ?? 0, 2) }}%
                            </span>
                        </td>
                        <td class="text-center">{{ $item['created_at'] ?? '-' }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="9" class="text-center" style="padding: 20px; color: #999999;">No data available</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
        
        <!-- Footer -->
        <div class="footer">
            <p>This document is an automatically generated report from HCMS E-Learning System</p>
            <p>Copyright © {{ date('Y') }} {{ $company }}. All Rights Reserved.</p>
            <p style="margin-top: 5px; font-style: italic;">This report is confidential and intended for authorized recipients only.</p>
        </div>
    </div>
</body>
</html>
