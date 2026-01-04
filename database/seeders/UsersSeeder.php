<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class UsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = [
            [
                'nip' => '1001',
                'name' => 'Budi Santoso',
                'email' => 'budi.santoso@bni.co.id',
                'password' => Hash::make('password123'),
                'role' => 'user',
                'status' => 'active',
                'phone' => '081234567801',
                'department' => 'IT',
            ],
            [
                'nip' => '1002',
                'name' => 'Siti Nurhaliza',
                'email' => 'siti.nurhaliza@bni.co.id',
                'password' => Hash::make('password123'),
                'role' => 'user',
                'status' => 'active',
                'phone' => '081234567802',
                'department' => 'HR',
            ],
            [
                'nip' => '1003',
                'name' => 'Ahmad Fauzi',
                'email' => 'ahmad.fauzi@bni.co.id',
                'password' => Hash::make('password123'),
                'role' => 'user',
                'status' => 'active',
                'phone' => '081234567803',
                'department' => 'Finance',
            ],
            [
                'nip' => '1004',
                'name' => 'Dewi Lestari',
                'email' => 'dewi.lestari@bni.co.id',
                'password' => Hash::make('password123'),
                'role' => 'user',
                'status' => 'active',
                'phone' => '081234567804',
                'department' => 'Marketing',
            ],
            [
                'nip' => '1005',
                'name' => 'Rudi Hartono',
                'email' => 'rudi.hartono@bni.co.id',
                'password' => Hash::make('password123'),
                'role' => 'user',
                'status' => 'active',
                'phone' => '081234567805',
                'department' => 'Operations',
            ],
            [
                'nip' => '1006',
                'name' => 'Maya Putri',
                'email' => 'maya.putri@bni.co.id',
                'password' => Hash::make('password123'),
                'role' => 'user',
                'status' => 'active',
                'phone' => '081234567806',
                'department' => 'Legal',
            ],
            [
                'nip' => '1007',
                'name' => 'Eko Prasetyo',
                'email' => 'eko.prasetyo@bni.co.id',
                'password' => Hash::make('password123'),
                'role' => 'user',
                'status' => 'active',
                'phone' => '081234567807',
                'department' => 'Risk Management',
            ],
            [
                'nip' => '1008',
                'name' => 'Fitri Handayani',
                'email' => 'fitri.handayani@bni.co.id',
                'password' => Hash::make('password123'),
                'role' => 'user',
                'status' => 'active',
                'phone' => '081234567808',
                'department' => 'Compliance',
            ],
            [
                'nip' => '1009',
                'name' => 'Andika Pratama',
                'email' => 'andika.pratama@bni.co.id',
                'password' => Hash::make('password123'),
                'role' => 'user',
                'status' => 'active',
                'phone' => '081234567809',
                'department' => 'IT',
            ],
            [
                'nip' => '1010',
                'name' => 'Rina Wulandari',
                'email' => 'rina.wulandari@bni.co.id',
                'password' => Hash::make('password123'),
                'role' => 'user',
                'status' => 'active',
                'phone' => '081234567810',
                'department' => 'HR',
            ],
            [
                'nip' => '1011',
                'name' => 'Hendra Gunawan',
                'email' => 'hendra.gunawan@bni.co.id',
                'password' => Hash::make('password123'),
                'role' => 'user',
                'status' => 'active',
                'phone' => '081234567811',
                'department' => 'Finance',
            ],
            [
                'nip' => '1012',
                'name' => 'Linda Kusuma',
                'email' => 'linda.kusuma@bni.co.id',
                'password' => Hash::make('password123'),
                'role' => 'user',
                'status' => 'active',
                'phone' => '081234567812',
                'department' => 'Marketing',
            ],
            [
                'nip' => '1013',
                'name' => 'Bambang Wijaya',
                'email' => 'bambang.wijaya@bni.co.id',
                'password' => Hash::make('password123'),
                'role' => 'user',
                'status' => 'active',
                'phone' => '081234567813',
                'department' => 'Operations',
            ],
            [
                'nip' => '1014',
                'name' => 'Ratna Sari',
                'email' => 'ratna.sari@bni.co.id',
                'password' => Hash::make('password123'),
                'role' => 'user',
                'status' => 'active',
                'phone' => '081234567814',
                'department' => 'Legal',
            ],
            [
                'nip' => '1015',
                'name' => 'Dedi Kurniawan',
                'email' => 'dedi.kurniawan@bni.co.id',
                'password' => Hash::make('password123'),
                'role' => 'user',
                'status' => 'active',
                'phone' => '081234567815',
                'department' => 'Risk Management',
            ],
            [
                'nip' => '1016',
                'name' => 'Sri Rahayu',
                'email' => 'sri.rahayu@bni.co.id',
                'password' => Hash::make('password123'),
                'role' => 'user',
                'status' => 'active',
                'phone' => '081234567816',
                'department' => 'Compliance',
            ],
            [
                'nip' => '1017',
                'name' => 'Agus Salim',
                'email' => 'agus.salim@bni.co.id',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'status' => 'active',
                'phone' => '081234567817',
                'department' => 'IT',
            ],
            [
                'nip' => '1018',
                'name' => 'Dian Permata',
                'email' => 'dian.permata@bni.co.id',
                'password' => Hash::make('password123'),
                'role' => 'user',
                'status' => 'active',
                'phone' => '081234567818',
                'department' => 'HR',
            ],
            [
                'nip' => '1019',
                'name' => 'Joko Widodo',
                'email' => 'joko.widodo@bni.co.id',
                'password' => Hash::make('password123'),
                'role' => 'user',
                'status' => 'active',
                'phone' => '081234567819',
                'department' => 'Finance',
            ],
            [
                'nip' => '1020',
                'name' => 'Nurul Hidayah',
                'email' => 'nurul.hidayah@bni.co.id',
                'password' => Hash::make('password123'),
                'role' => 'user',
                'status' => 'inactive',
                'phone' => '081234567820',
                'department' => 'Marketing',
            ],
        ];

        foreach ($users as $userData) {
            User::updateOrCreate(
                ['email' => $userData['email']], // Cek berdasarkan email
                $userData // Data yang akan dibuat/diupdate
            );
        }

        $this->command->info('20 users berhasil ditambahkan!');
    }
}
