<?php

namespace App\Listeners;

use App\Services\PointsService;
use App\Models\ExamAttempt;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

/**
 * Listener untuk tracking poin ketika exam lulus
 */
class ExamPassedListener implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle exam passed dan record poin
     * 
     * Event fired ketika exam lulus (is_passed = true)
     */
    public function handle($event)
    {
        // Ambil exam attempt dari event
        $exam = $event->exam ?? null;
        
        if (!$exam instanceof ExamAttempt) {
            return;
        }

        if (!$exam->is_passed) {
            return;
        }

        $pointsService = app(PointsService::class);
        $pointsService->recordExamPass(
            $exam->user_id,
            $exam->id,
            $exam->percentage ?? 0
        );
    }
}
