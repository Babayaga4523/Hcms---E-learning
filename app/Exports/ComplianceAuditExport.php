<?php

namespace App\Exports;

use App\Models\ComplianceEvidence;
use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ComplianceAuditExport implements FromArray, WithHeadings, WithStyles
{
    protected $filters;

    public function __construct($filters = [])
    {
        $this->filters = $filters;
    }

    public function array(): array
    {
        $query = ComplianceEvidence::with(['user', 'program']);

        if (isset($this->filters['user_id'])) {
            $query->where('user_id', $this->filters['user_id']);
        }

        if (isset($this->filters['status'])) {
            $query->where('status', $this->filters['status']);
        }

        $evidences = $query->get();

        $data = [];
        foreach ($evidences as $evidence) {
            $data[] = [
                'user' => $evidence->user->name,
                'program' => $evidence->program->name ?? 'N/A',
                'evidence_type' => $evidence->evidence_type,
                'status' => $evidence->status,
                'submission_date' => $evidence->created_at,
                'approval_date' => $evidence->approved_at ?? 'Pending',
                'verified_by' => $evidence->verified_by ?? 'Pending',
                'description' => $evidence->description,
            ];
        }

        return $data;
    }

    public function headings(): array
    {
        return [
            'User Name',
            'Program',
            'Evidence Type',
            'Status',
            'Submission Date',
            'Approval Date',
            'Verified By',
            'Description',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true], 'fill' => ['fillType' => 'solid', 'fgColor' => ['rgb' => 'F59E0B']]],
        ];
    }
}
