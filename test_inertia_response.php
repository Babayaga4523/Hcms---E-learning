<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

// Simulate the exact same queries as the controller
$query = 'budi';

// Search users
$users = \App\Models\User::where('role', 'user')
    ->where(function($q) use ($query) {
        $q->where('name', 'like', "%{$query}%")
          ->orWhere('email', 'like', "%{$query}%")
          ->orWhere('nip', 'like', "%{$query}%")
          ->orWhere('department', 'like', "%{$query}%");
    })
    ->with('trainings')
    ->limit(10)
    ->get()
    ->map(fn($user) => [
        'id' => $user->id,
        'name' => $user->name,
        'nip' => $user->nip,
        'email' => $user->email,
        'role' => $user->role,
        'department' => $user->department,
        'total_trainings' => $user->trainings->count(),
        'completed_trainings' => $user->trainings->where('status', 'completed')->count(),
    ])
    ->toArray();

// Search modules
$modules = \App\Models\Module::where('is_active', true)
    ->where(function($q) use ($query) {
        $q->where('title', 'like', "%{$query}%")
          ->orWhere('description', 'like', "%{$query}%");
    })
    ->with('userTrainings')
    ->limit(10)
    ->get()
    ->map(fn($module) => [
        'id' => $module->id,
        'title' => $module->title,
        'description' => $module->description,
        'category' => $module->category ?? 'General',
        'duration' => $module->duration ?? '1h',
        'rating' => 4.5,
        'total_enrollments' => $module->userTrainings->count(),
        'completed_count' => $module->userTrainings->where('status', 'completed')->count(),
    ])
    ->toArray();

// Search trainings
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
    ->get()
    ->map(fn($training) => [
        'id' => $training->id,
        'user_name' => $training->user?->name ?? 'N/A',
        'user_nip' => $training->user?->nip ?? 'N/A',
        'module_title' => $training->module?->title ?? 'N/A',
        'title' => $training->module?->title ?? 'N/A',
        'status' => $training->status,
        'progress' => $training->final_score ?? 0,
        'enrolled_at' => $training->enrolled_at,
    ])
    ->toArray();

// Simulate Inertia response
/** @var \Illuminate\Contracts\Auth\Guard $guard */
$guard = auth();
/** @var \App\Models\User|null $authUser */
$authUser = $guard->user();
$response = [
    'query' => $query,
    'users' => $users,
    'modules' => $modules,
    'trainings' => $trainings,
    'auth' => [
        'user' => $authUser ? [
            'id' => $authUser->id,
            'name' => $authUser->name,
            'email' => $authUser->email,
            'role' => $authUser->role,
        ] : null,
    ],
];

echo "=== INERTIA RESPONSE SIMULATION ===\n\n";
echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
echo "\n\n=== COUNTS ===\n";
echo "Users: " . count($users) . "\n";
echo "Modules: " . count($modules) . "\n";
echo "Trainings: " . count($trainings) . "\n";
echo "Total: " . (count($users) + count($modules) + count($trainings)) . "\n";
