<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

// Test search dengan 'budi'
$query = 'budi';

echo "=== TESTING SEARCH QUERY: '$query' ===\n\n";

// Test 1: Users
echo "1. SEARCHING USERS:\n";
$users = \App\Models\User::where('role', 'user')
    ->where(function($q) use ($query) {
        $q->where('name', 'like', "%{$query}%")
          ->orWhere('email', 'like', "%{$query}%")
          ->orWhere('nip', 'like', "%{$query}%")
          ->orWhere('department', 'like', "%{$query}%");
    })
    ->with('trainings')
    ->limit(10)
    ->get();

echo "   Found: " . count($users) . " users\n";
foreach ($users as $u) {
    echo "   - " . $u->name . " (Trainings: " . $u->trainings->count() . ")\n";
}

// Test 2: Modules
echo "\n2. SEARCHING MODULES:\n";
$modules = \App\Models\Module::where('is_active', true)
    ->where(function($q) use ($query) {
        $q->where('title', 'like', "%{$query}%")
          ->orWhere('description', 'like', "%{$query}%");
    })
    ->with('userTrainings')
    ->limit(10)
    ->get();

echo "   Found: " . count($modules) . " modules\n";
foreach ($modules as $m) {
    echo "   - " . $m->title . "\n";
}

// Test 3: Trainings
echo "\n3. SEARCHING TRAININGS:\n";
$trainings = \App\Models\UserTraining::with(['user', 'module'])
    ->where(function($q) use ($query) {
        $q->whereHas('user', function($userQ) use ($query) {
            $userQ->where('name', 'like', "%{$query}%")
                  ->orWhere('nip', 'like', "%{$query}%");
        })
        ->orWhereHas('module', function($moduleQ) use ($query) {
            $moduleQ->where('title', 'like', "%{$query}%");
        });
    })
    ->limit(10)
    ->get();

echo "   Found: " . count($trainings) . " trainings\n";
foreach ($trainings as $t) {
    echo "   - " . ($t->user?->name ?? 'N/A') . " -> " . ($t->module?->title ?? 'N/A') . " [" . $t->status . "]\n";
}

echo "\n=== END SEARCH TEST ===\n";
