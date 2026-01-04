<?php

/**
 * Script to sync existing ModuleAssignments to UserTrainings
 * Run this once to fix existing assignments that don't appear on user dashboard
 * 
 * Usage: php sync_assignments.php
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\ModuleAssignment;
use App\Models\UserTraining;
use Illuminate\Support\Facades\DB;

echo "=== Syncing ModuleAssignments to UserTrainings ===\n\n";

// Get all module assignments
$assignments = ModuleAssignment::all();
echo "Found " . $assignments->count() . " module assignments\n\n";

$synced = 0;
$skipped = 0;

foreach ($assignments as $assignment) {
    // Check if UserTraining already exists
    $existing = UserTraining::where('module_id', $assignment->module_id)
        ->where('user_id', $assignment->user_id)
        ->first();
    
    if ($existing) {
        $skipped++;
        echo "  [SKIP] User #{$assignment->user_id} already enrolled in Module #{$assignment->module_id}\n";
    } else {
        // Map ModuleAssignment status to UserTraining status
        // UserTraining accepts: enrolled, in_progress, completed, failed
        $statusMap = [
            'pending' => 'enrolled',
            'not_started' => 'enrolled',
            'in_progress' => 'in_progress',
            'completed' => 'completed',
            'failed' => 'failed',
        ];
        $status = $statusMap[$assignment->status ?? 'not_started'] ?? 'enrolled';
        
        // Create UserTraining record
        UserTraining::create([
            'user_id' => $assignment->user_id,
            'module_id' => $assignment->module_id,
            'status' => $status,
            'final_score' => null,
            'is_certified' => false,
            'enrolled_at' => $assignment->assigned_date ?? now(),
            'completed_at' => null,
        ]);
        $synced++;
        echo "  [SYNC] Created UserTraining for User #{$assignment->user_id} -> Module #{$assignment->module_id}\n";
    }
}

echo "\n=== Summary ===\n";
echo "Synced: {$synced}\n";
echo "Skipped (already exists): {$skipped}\n";
echo "\nDone!\n";
