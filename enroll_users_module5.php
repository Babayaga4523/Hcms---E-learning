<?php

use Illuminate\Support\Facades\DB;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Enrolling Test Users to Module 5 ===\n\n";

// Get all users with role 'user'
$users = DB::table('users')->where('role', 'user')->get();

if ($users->count() === 0) {
    echo "❌ No users found with role 'user'\n";
    exit;
}

echo "Found {$users->count()} user(s)\n\n";

foreach ($users as $user) {
    // Check if already enrolled
    $existing = DB::table('user_trainings')
        ->where('user_id', $user->id)
        ->where('module_id', 5)
        ->first();
    
    if ($existing) {
        echo "✓ {$user->name} (ID: {$user->id}) - Already enrolled\n";
    } else {
        DB::table('user_trainings')->insert([
            'user_id' => $user->id,
            'module_id' => 5,
            'status' => 'enrolled',
            'is_certified' => false,
            'enrolled_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        echo "✓ {$user->name} (ID: {$user->id}) - Enrolled successfully\n";
    }
}

echo "\n✅ Enrollment complete!\n";
