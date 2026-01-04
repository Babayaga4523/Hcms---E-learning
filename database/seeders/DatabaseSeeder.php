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
        User::factory()->create([
            'name' => 'Admin BNI',
            'email' => 'admin@bni.co.id',
            'nip' => '999999',
            'role' => 'admin',
            'department' => 'Management',
            'password' => Hash::make('admin123'),
            'email_verified_at' => now(),
        ]);

        // Create Regular Users
        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'role' => 'user',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);

        // Run Dashboard Seeder
        $this->call(DashboardSeeder::class);
    }
}
