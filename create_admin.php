<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

// Create or update admin user
$admin = User::updateOrCreate(
    ['email' => 'admin@example.com'],
    [
        'name' => 'Admin User',
        'password' => Hash::make('password'),
        'nip' => '00000001',
        'role' => 'admin',
        'status' => 'active'
    ]
);

echo "✓ Admin user created: {$admin->email} (password: password)\n";
