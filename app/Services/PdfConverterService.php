<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class PdfConverterService
{
    /**
     * Convert Office file (PPT, Word, Excel) to PDF using LibreOffice
     * 
     * @param string $inputPath Full path to input file
     * @param string $outputDir Directory to save PDF
     * @return string|null Path to generated PDF file or null if failed
     */
    public function convertToPdf(string $inputPath, string $outputDir): ?string
    {
        try {
            // Check if file exists
            if (!file_exists($inputPath)) {
                Log::error("Input file not found: {$inputPath}");
                return null;
            }

            // Create output directory if not exists
            if (!is_dir($outputDir)) {
                mkdir($outputDir, 0755, true);
            }

            // Find LibreOffice executable
            $soffice = $this->findLibreOffice();
            
            if (!$soffice) {
                Log::error("LibreOffice not found");
                return null;
            }

            // Escape paths for command line
            $escapedInput = escapeshellarg($inputPath);
            $escapedOutput = escapeshellarg($outputDir);

            // Convert to PDF command
            $command = "\"{$soffice}\" --headless --convert-to pdf --outdir {$escapedOutput} {$escapedInput} 2>&1";
            
            Log::info("Converting to PDF: {$command}");
            
            // Execute conversion
            exec($command, $output, $returnCode);
            
            Log::info("Conversion output", ['output' => $output, 'return_code' => $returnCode]);

            if ($returnCode !== 0) {
                Log::error("PDF conversion failed", ['output' => implode("\n", $output)]);
                return null;
            }

            // Get the PDF file name (same as input but with .pdf extension)
            $fileName = pathinfo($inputPath, PATHINFO_FILENAME) . '.pdf';
            $pdfPath = $outputDir . DIRECTORY_SEPARATOR . $fileName;

            if (file_exists($pdfPath)) {
                Log::info("PDF created successfully: {$pdfPath}");
                return $pdfPath;
            }

            Log::error("PDF file not created: {$pdfPath}");
            return null;

        } catch (\Exception $e) {
            Log::error("PDF conversion exception: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Find LibreOffice executable path
     * 
     * @return string|null
     */
    private function findLibreOffice(): ?string
    {
        // Common LibreOffice paths on Windows
        $windowsPaths = [
            'C:\Program Files\LibreOffice\program\soffice.exe',
            'C:\Program Files (x86)\LibreOffice\program\soffice.exe',
            'C:\Program Files\LibreOffice 7\program\soffice.exe',
            'C:\Program Files\LibreOffice 24\program\soffice.exe',
            'C:\Program Files\LibreOffice 25\program\soffice.exe',
        ];

        // Common LibreOffice paths on Linux/Mac
        $unixPaths = [
            '/usr/bin/soffice',
            '/usr/bin/libreoffice',
            '/Applications/LibreOffice.app/Contents/MacOS/soffice',
        ];

        $paths = DIRECTORY_SEPARATOR === '\\' ? $windowsPaths : $unixPaths;

        foreach ($paths as $path) {
            if (file_exists($path)) {
                return $path;
            }
        }

        // Try to find in PATH
        $command = DIRECTORY_SEPARATOR === '\\' ? 'where soffice' : 'which soffice';
        exec($command, $output, $returnCode);
        
        if ($returnCode === 0 && !empty($output[0])) {
            return trim($output[0]);
        }

        return null;
    }

    /**
     * Check if file type needs PDF conversion
     * 
     * @param string $extension
     * @return bool
     */
    public function needsConversion(string $extension): bool
    {
        $convertibleExtensions = ['ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx', 'odt', 'ods', 'odp'];
        return in_array(strtolower($extension), $convertibleExtensions);
    }
}
