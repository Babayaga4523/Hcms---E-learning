<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // Send scheduled notifications every minute
        $schedule->command('notifications:send-scheduled')
            ->everyMinute()
            ->runInBackground()
            ->withoutOverlapping()
            ->onFailure(function () {
                \Illuminate\Support\Facades\Log::error('SendScheduledNotifications command failed');
            })
            ->onSuccess(function () {
                \Illuminate\Support\Facades\Log::info('SendScheduledNotifications command executed successfully');
            });

        // Publish scheduled announcements every minute
        $schedule->command('announcements:publish-scheduled')
            ->everyMinute()
            ->runInBackground()
            ->withoutOverlapping()
            ->onFailure(function () {
                \Illuminate\Support\Facades\Log::error('PublishScheduledAnnouncements command failed');
            })
            ->onSuccess(function () {
                \Illuminate\Support\Facades\Log::info('PublishScheduledAnnouncements command executed successfully');
            });
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__ . '/Commands');

        require base_path('routes/console.php');
    }
}
