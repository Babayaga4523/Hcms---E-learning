<?php

namespace App\Console\Commands;

use App\Models\TrainingMaterial;
use App\Services\PdfConverterService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ConvertExistingFilesToPdf extends Command
{
    protected $signature = 'materials:convert-to-pdf {--force : Force reconvert even if PDF exists}';
    protected $description = 'Convert existing Office files (PPT, Word, Excel) to PDF';

    public function handle()
    {
        $converter = new PdfConverterService();
        
        // Get all materials that need conversion
        $materials = TrainingMaterial::whereNotNull('file_path')
            ->whereIn('file_type', ['presentation', 'document', 'spreadsheet'])
            ->get();

        if ($materials->isEmpty()) {
            $this->info('No materials found that need conversion.');
            return 0;
        }

        $this->info("Found {$materials->count()} materials to process...\n");

        $converted = 0;
        $skipped = 0;
        $failed = 0;

        foreach ($materials as $material) {
            $fileName = $material->file_name;
            $extension = pathinfo($fileName, PATHINFO_EXTENSION);

            // Skip if already has PDF and not forcing
            if ($material->pdf_path && !$this->option('force')) {
                $this->line("⏭️  Skipped: {$fileName} (already has PDF)");
                $skipped++;
                continue;
            }

            // Check if needs conversion
            if (!$converter->needsConversion($extension)) {
                $this->line("⏭️  Skipped: {$fileName} (not an Office file)");
                $skipped++;
                continue;
            }

            $this->line("🔄 Converting: {$fileName}...");

            try {
                $fullInputPath = storage_path('app/public/' . $material->file_path);
                
                if (!file_exists($fullInputPath)) {
                    $this->error("❌ File not found: {$fullInputPath}");
                    $failed++;
                    continue;
                }

                $outputDir = storage_path('app/public/training-materials/pdf');
                $pdfFullPath = $converter->convertToPdf($fullInputPath, $outputDir);

                if ($pdfFullPath) {
                    $pdfPath = 'training-materials/pdf/' . basename($pdfFullPath);
                    $material->pdf_path = $pdfPath;
                    $material->save();

                    $this->info("✅ Converted: {$fileName} → {$pdfPath}");
                    $converted++;
                } else {
                    $this->error("❌ Conversion failed: {$fileName}");
                    $failed++;
                }

            } catch (\Exception $e) {
                $this->error("❌ Error converting {$fileName}: " . $e->getMessage());
                $failed++;
            }
        }

        $this->newLine();
        $this->info("=== Conversion Summary ===");
        $this->info("✅ Converted: {$converted}");
        $this->info("⏭️  Skipped: {$skipped}");
        $this->error("❌ Failed: {$failed}");

        return $failed > 0 ? 1 : 0;
    }
}
