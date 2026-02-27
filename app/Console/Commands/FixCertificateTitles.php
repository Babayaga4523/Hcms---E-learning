<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Certificate;
use App\Models\Module;

class FixCertificateTitles extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:fix-certificate-titles';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix certificates with null or empty training_title';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for certificates with null/empty training_title...');

        $certs = Certificate::whereNull('training_title')
            ->orWhere('training_title', '')
            ->get();

        if ($certs->isEmpty()) {
            $this->info('✓ No certificates need fixing!');
            return 0;
        }

        $this->warn('Found ' . $certs->count() . ' certificates that need fixing');

        foreach ($certs as $cert) {
            $module = Module::find($cert->module_id);
            $newTitle = null;

            if ($module && trim($module->title ?? '')) {
                $newTitle = $module->title;
            } else {
                $newTitle = 'Program Pelatihan #' . $cert->module_id;
            }

            $cert->update(['training_title' => $newTitle]);
            $this->line("✓ Fixed Certificate {$cert->id}: {$newTitle}");
        }

        $this->info("\n✓ All {$certs->count()} certificates fixed successfully!");
        return 0;
    }
}
