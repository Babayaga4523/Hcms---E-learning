<?php

namespace App\Jobs;

use App\Models\Certificate;
use App\Models\Module;
use App\Models\User;
use App\Models\UserTraining;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * GenerateCertificateJob
 * 
 * Queue job untuk generate certificate secara async (latar belakang)
 * Ini mencegah user experience lag saat submit quiz
 * 
 * Usage:
 *   GenerateCertificateJob::dispatch($userId, $moduleId);
 */
class GenerateCertificateJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Jumlah kali job akan di-retry jika gagal
     * @var int
     */
    public int $tries = 3;

    /**
     * Timeout untuk job (dalam detik)
     * @var int
     */
    public int $timeout = 300; // 5 menit

    protected $userId;
    protected $moduleId;

    /**
     * Create a new job instance.
     */
    public function __construct($userId, $moduleId)
    {
        $this->userId = $userId;
        $this->moduleId = $moduleId;
        
        // Set queue dan priority
        $this->onQueue('certificates');
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            $user = User::find($this->userId);
            $module = Module::find($this->moduleId);

            if (!$user || !$module) {
                Log::warning('Certificate generation failed: User or Module not found', [
                    'user_id' => $this->userId,
                    'module_id' => $this->moduleId
                ]);
                return;
            }

            // Cek apakah certificate sudah ada
            $existingCert = Certificate::where('user_id', $this->userId)
                ->where('module_id', $this->moduleId)
                ->first();

            if ($existingCert) {
                Log::info('Certificate already exists, skipping generation', [
                    'user_id' => $this->userId,
                    'module_id' => $this->moduleId
                ]);
                // Update is_certified flag even if certificate already exists
                UserTraining::where('user_id', $this->userId)
                    ->where('module_id', $this->moduleId)
                    ->update(['is_certified' => true]);
                return;
            }

            // Generate certificate baru
            $certificate = Certificate::createForUser($this->userId, $this->moduleId);

            if ($certificate) {
                // Update is_certified flag after successfully creating certificate
                UserTraining::where('user_id', $this->userId)
                    ->where('module_id', $this->moduleId)
                    ->update(['is_certified' => true]);

                Log::info('Certificate generated successfully', [
                    'user_id' => $this->userId,
                    'module_id' => $this->moduleId,
                    'certificate_id' => $certificate->id
                ]);
            } else {
                Log::error('Failed to create certificate', [
                    'user_id' => $this->userId,
                    'module_id' => $this->moduleId
                ]);
            }

        } catch (\Exception $e) {
            Log::error('Error in GenerateCertificateJob (attempt ' . $this->attempts() . ' of ' . $this->tries . ')', [
                'user_id' => $this->userId,
                'module_id' => $this->moduleId,
                'exception' => $e->getMessage(),
                'attempt' => $this->attempts()
            ]);

            // Jika belum mencapai batas retry, release ke queue dengan exponential backoff
            if ($this->attempts() < $this->tries) {
                $delaySeconds = 60 * $this->attempts(); // 60s, 120s, 180s
                Log::info('Retrying GenerateCertificateJob after ' . $delaySeconds . ' seconds', [
                    'user_id' => $this->userId,
                    'module_id' => $this->moduleId,
                    'attempt' => $this->attempts()
                ]);
                $this->release($delaySeconds);
            } else {
                // Sudah mencapai batas retry, fail job
                Log::error('GenerateCertificateJob failed after ' . $this->tries . ' attempts', [
                    'user_id' => $this->userId,
                    'module_id' => $this->moduleId
                ]);
                throw $e; // Akan memanggil failed() method
            }
        }
    }

    /**
     * Handle job failure
     */
    public function failed(\Exception $exception): void
    {
        Log::error('GenerateCertificateJob permanently failed', [
            'user_id' => $this->userId,
            'module_id' => $this->moduleId,
            'exception' => $exception->getMessage()
        ]);

        // Bisa tambah notifikasi ke admin di sini jika perlu
    }
}
