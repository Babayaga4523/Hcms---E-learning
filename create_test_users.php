<?php

use App\Models\User;
use App\Models\Module;
use App\Models\UserTraining;

// Buat 3 test users
$users = [
    [
        'name' => 'Andi Pratama',
        'email' => 'andi@example.com',
        'password' => bcrypt('password'),
        'nip' => '11223344',
        'role' => 'user',
        'status' => 'active'
    ],
    [
        'name' => 'Siti Nurhaliza',
        'email' => 'siti@example.com',
        'password' => bcrypt('password'),
        'nip' => '55667788',
        'role' => 'user',
        'status' => 'active'
    ],
    [
        'name' => 'Budi Santoso',
        'email' => 'budi@example.com',
        'password' => bcrypt('password'),
        'nip' => '99001122',
        'role' => 'user',
        'status' => 'active'
    ]
];

$createdUsers = [];
foreach ($users as $userData) {
    $user = User::firstOrCreate(
        ['email' => $userData['email']],
        $userData
    );
    $createdUsers[] = $user;
    echo "✓ User: {$user->name} ({$user->email})\n";
}

// Enroll users ke modules
$modules = Module::all();
foreach ($createdUsers as $user) {
    foreach ($modules as $module) {
        UserTraining::firstOrCreate(
            [
                'user_id' => $user->id,
                'module_id' => $module->id
            ],
            [
                'status' => 'enrolled',
                'final_score' => null,
                'is_certified' => false
            ]
        );
    }
    echo "✓ User {$user->name} enrolled ke {$modules->count()} modules\n";
}

echo "\n✓ Sample data berhasil dibuat!\n";
echo "Login credentials:\n";
echo "  Admin: admin@example.com / password\n";
echo "  User 1: andi@example.com / password\n";
echo "  User 2: siti@example.com / password\n";
echo "  User 3: budi@example.com / password\n";
