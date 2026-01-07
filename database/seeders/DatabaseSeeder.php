<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create Admin User
        User::updateOrCreate(
            ['email' => 'admin@bni.co.id'],
            [
                'name' => 'Admin BNI',
                'nip' => '999999',
                'role' => 'admin',
                'department' => 'Management',
                'password' => Hash::make('admin123'),
                'email_verified_at' => now(),
            ]
        );

        // Create Regular Users
        User::updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'role' => 'user',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        // Run Dashboard Seeder
        $this->call(DashboardSeeder::class);
    }
}
