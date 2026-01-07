<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Module;

echo "=== Current Modules Status ===\n";
$modules = Module::all(['id', 'title', 'is_active', 'approval_status', 'category', 'difficulty', 'rating']);

foreach ($modules as $module) {
    echo "ID: {$module->id}\n";
    echo "  Title: {$module->title}\n";
    echo "  Active: " . ($module->is_active ? 'Yes' : 'No') . "\n";
    echo "  Status: {$module->approval_status}\n";
    echo "  Category: {$module->category}\n";
    echo "  Difficulty: {$module->difficulty}\n";
    echo "  Rating: {$module->rating}\n";
    echo "\n";
}

echo "\n=== Updating All Modules ===\n";
$updated = Module::query()->update([
    'is_active' => true,
    'approval_status' => 'approved',
    'category' => 'compliance',
    'difficulty' => 'intermediate',
    'rating' => 4.5
]);

echo "Updated {$updated} modules\n\n";

echo "=== Verification ===\n";
$active = Module::where('is_active', true)
    ->where('approval_status', 'approved')
    ->count();
    
echo "Active & Approved Modules: {$active}\n";
echo "\nDone! Now refresh your /catalog page.\n";
