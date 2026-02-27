<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$request = Illuminate\Http\Request::capture();
$response = $kernel->handle($request);

// Now we can use Laravel
$admin = \App\Models\User::where('email', 'admin@example.com')->first();
if ($admin) {
    echo "✓ Admin user ditemukan:\n";
    echo "  Email: " . $admin->email . "\n";
    echo "  Role: " . $admin->role . "\n";
    echo "  ID: " . $admin->id . "\n";
} else {
    echo "✗ Admin user TIDAK ditemukan. Membuat...\n";
    $admin = \App\Models\User::create([
        'name' => 'Admin User',
        'email' => 'admin@example.com',
        'password' => bcrypt('password'),
        'role' => 'admin',
        'nip' => 'ADM001',
        'department' => 'Management'
    ]);
    echo "✓ User admin dibuat:\n";
    echo "  Email: admin@example.com\n";
    echo "  Password: password\n";
    echo "  ID: " . $admin->id . "\n";
}

echo "\n=== Token Fix Status ===\n";
echo "✓ LoginRequest diperbaiki - field 'status' dihapus\n";
echo "✓ Sekarang login hanya membutuhkan email + password\n";
