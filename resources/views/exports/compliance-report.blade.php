<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
        table { width: 100%; border-collapse: collapse; }
        th { background-color: #003399; color: white; font-weight: bold; text-align: center; border: 1px solid #CCCCCC; padding: 8px; }
        td { border: 1px solid #EEEEEE; padding: 8px; }
        tr:nth-child(even) { background-color: #F5F5F5; }
        .header { text-align: center; padding: 10px; font-size: 16px; font-weight: bold; }
        .subheader { text-align: center; padding: 5px; font-size: 10px; color: #666666; }
        .badge-active { background-color: #D1FAE5; color: #047857; padding: 4px 8px; border-radius: 4px; }
        .badge-inactive { background-color: #FEE2E2; color: #DC2626; padding: 4px 8px; border-radius: 4px; }
        .badge-high { background-color: #D1FAE5; padding: 4px 8px; border-radius: 4px; }
        .badge-medium { background-color: #FEF3C7; padding: 4px 8px; border-radius: 4px; }
        .badge-low { background-color: #FEE2E2; padding: 4px 8px; border-radius: 4px; }
    </style>
</head>
<body>
<table>
    <tr>
        <td colspan="9" class="header">{{ $title }}</td>
    </tr>
    <tr>
        <td colspan="9" class="subheader">Generated on {{ $generatedAt }} | {{ $company }}</td>
    </tr>
    <tr>
        <td colspan="9"></td>
    </tr>
    <tr>
        <th>No</th>
        <th>Name</th>
        <th>Email</th>
        <th>Role</th>
        <th>Status</th>
        <th>Total Training</th>
        <th>Completed</th>
        <th>Compliance %</th>
        <th>Created At</th>
    </tr>
    @forelse($data as $index => $item)
        <tr>
            <td style="text-align: center;">{{ $index + 1 }}</td>
            <td>{{ $item['name'] ?? '-' }}</td>
            <td>{{ $item['email'] ?? '-' }}</td>
            <td style="text-align: center;">{{ ucfirst($item['role'] ?? '-') }}</td>
            <td style="text-align: center;">
                <span class="badge-{{ $item['status'] === 'active' ? 'active' : 'inactive' }}">
                    {{ ucfirst($item['status'] ?? '-') }}
                </span>
            </td>
            <td style="text-align: center;">{{ $item['total_trainings'] ?? 0 }}</td>
            <td style="text-align: center;">{{ $item['completed_trainings'] ?? 0 }}</td>
            <td style="text-align: center; font-weight: bold;">
                <span class="badge-{{ $item['compliance_rate'] >= 80 ? 'high' : ($item['compliance_rate'] >= 60 ? 'medium' : 'low') }}">
                    {{ round($item['compliance_rate'] ?? 0, 2) }}%
                </span>
            </td>
            <td style="text-align: center; font-size: 10px;">{{ $item['created_at'] ?? '-' }}</td>
        </tr>
    @empty
        <tr>
            <td colspan="9" style="text-align: center; padding: 20px; color: #999999;">No data available</td>
        </tr>
    @endforelse
</table>
</body>
</html>
