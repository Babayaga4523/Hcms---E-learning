<?php

namespace App\Services;

use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Writer\Pdf\Mpdf;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class ExcelToPdfService
{
    /**
     * Convert Excel file to PDF
     * 
     * @param string $excelPath Path to Excel file
     * @param string $outputPath Path where PDF will be saved
     * @return bool Success status
     */
    public static function convert($excelPath, $outputPath)
    {
        try {
            // Check if Excel file exists
            if (!file_exists($excelPath)) {
                Log::error("Excel file not found: {$excelPath}");
                return false;
            }

            // Load Excel file
            $spreadsheet = IOFactory::load($excelPath);
            
            // Set active sheet to first sheet
            $spreadsheet->setActiveSheetIndex(0);
            
            // Configure for PDF output
            $writer = new Mpdf($spreadsheet);
            
            // Set page orientation and size
            $spreadsheet->getActiveSheet()->getPageSetup()
                ->setOrientation(\PhpOffice\PhpSpreadsheet\Worksheet\PageSetup::ORIENTATION_LANDSCAPE)
                ->setPaperSize(\PhpOffice\PhpSpreadsheet\Worksheet\PageSetup::PAPERSIZE_A4);
            
            // Set margins
            $spreadsheet->getActiveSheet()->getPageMargins()
                ->setTop(0.5)
                ->setRight(0.5)
                ->setBottom(0.5)
                ->setLeft(0.5);

            // Set to fit on one page width
            $spreadsheet->getActiveSheet()->getPageSetup()
                ->setFitToPage(true)
                ->setFitToHeight(0)
                ->setFitToWidth(1);

            // Set print area to all data
            $spreadsheet->getActiveSheet()->setAutoFilter(
                $spreadsheet->getActiveSheet()->calculateWorksheetDimension()
            );

            // Create directory if not exists
            $directory = dirname($outputPath);
            if (!is_dir($directory)) {
                mkdir($directory, 0755, true);
            }

            // Save to PDF
            $writer->save($outputPath);

            Log::info("Successfully converted Excel to PDF: {$excelPath} -> {$outputPath}");
            return true;

        } catch (\Exception $e) {
            Log::error("Excel to PDF conversion failed: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Convert Excel uploaded file directly to PDF storage path
     * 
     * @param \Illuminate\Http\UploadedFile $file Uploaded Excel file
     * @param string $storagePath Path in storage where PDF should be saved
     * @return string|null Path to PDF file or null if failed
     */
    public static function convertUploadedFile($file, $storagePath)
    {
        try {
            // Store uploaded file temporarily
            $tempPath = storage_path('temp/' . uniqid() . '.' . $file->getClientOriginalExtension());
            
            // Create temp directory if not exists
            if (!is_dir(dirname($tempPath))) {
                mkdir(dirname($tempPath), 0755, true);
            }

            // Move uploaded file to temp location
            $file->move(dirname($tempPath), basename($tempPath));

            // Generate PDF path
            $pdfPath = storage_path('app/' . $storagePath);
            $pdfDirectory = dirname($pdfPath);

            // Create directory if not exists
            if (!is_dir($pdfDirectory)) {
                mkdir($pdfDirectory, 0755, true);
            }

            // Convert to PDF
            $success = self::convert($tempPath, $pdfPath);

            // Clean up temp file
            if (file_exists($tempPath)) {
                unlink($tempPath);
            }

            return $success ? $storagePath : null;

        } catch (\Exception $e) {
            Log::error("Uploaded file conversion failed: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Check if file is Excel
     * 
     * @param string $mimeType MIME type of file
     * @return bool
     */
    public static function isExcelFile($mimeType)
    {
        $excelMimes = [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/csv',
        ];

        return in_array($mimeType, $excelMimes);
    }
}
