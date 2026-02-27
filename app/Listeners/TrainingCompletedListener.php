<?php

namespace App\Listeners;

use App\Services\PointsService;
use App\Models\UserTraining;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

/**
 * Listener untuk tracking poin ketika training selesai
 */
class TrainingCompletedListener implements ShouldQueue
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
     * Handle training completion dan record poin
     * 
     * Event fired dari: UserTrainingService atau Controller ketika training di-complete
     */
    public function handle($event)
    {
        // Ambil training dari event
        $training = $event->training ?? null;
        
        if (!$training instanceof UserTraining) {
            return;
        }

        if ($training->status !== 'completed') {
            return;
        }

        $pointsService = app(PointsService::class);
        $pointsService->recordModuleCompletion(
            $training->user_id,
            $training->module_id,
            $training->is_certified
        );
    }
}
