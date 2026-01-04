<?php

namespace App\Exports;

use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use Maatwebsite\Excel\Concerns\WithHeadings;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Color;

class ComplianceReportExport implements FromView, WithStyles, WithColumnWidths, WithColumnFormatting
{
    protected $data;
    protected $title;

    public function __construct($data = [], $title = 'Compliance Report')
    {
        $this->data = $data;
        $this->title = $title;
    }

    public function view(): View
    {
        return view('exports.compliance-report', [
            'data' => $this->data,
            'title' => $this->title,
            'generatedAt' => now()->format('Y-m-d H:i:s'),
            'company' => config('app.name', 'HCMS E-Learning'),
        ]);
    }

    public function columnWidths(): array
    {
        return [
            'A' => 5,    // No
            'B' => 25,   // Name
            'C' => 30,   // Email
            'D' => 15,   // Role
            'E' => 15,   // Status
            'F' => 12,   // Total Training
            'G' => 12,   // Completed
            'H' => 15,   // Compliance %
            'I' => 18,   // Created At
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        // Header styling - BNI Professional Blue
        $headerStyle = [
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
                'size' => 12,
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '003399'], // BNI Blue
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
                'wrapText' => true,
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => 'CCCCCC'],
                ],
            ],
        ];

        // Title styling
        $titleStyle = [
            'font' => [
                'bold' => true,
                'size' => 16,
                'color' => ['rgb' => '003399'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
        ];

        // Subtitle styling
        $subtitleStyle = [
            'font' => [
                'size' => 10,
                'color' => ['rgb' => '666666'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
            ],
        ];

        // Data row styling
        $rowStyle = [
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_LEFT,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => 'EEEEEE'],
                ],
            ],
        ];

        // Alternating row colors
        $alternateRowStyle = [
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'F5F5F5'],
            ],
        ];

        // Compliance rate styling
        $complianceStyle = [
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
            'font' => [
                'bold' => true,
            ],
        ];

        return [
            // Title
            '1' => $titleStyle,
            // Subtitle
            '2' => $subtitleStyle,
            // Header row
            '5' => $headerStyle,
        ];
    }

    public function columnFormats(): array
    {
        return [
            'H' => '0.00"%"', // Compliance percentage
            'I' => 'yyyy-mm-dd hh:mm:ss', // Date format
        ];
    }
}
