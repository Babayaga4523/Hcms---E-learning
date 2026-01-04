<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\Module;
use App\Models\UserTraining;

// Find admin user
$admin = User::where('role', 'admin')->first();
if ($admin) {
    $modules = Module::all();
    foreach ($modules as $module) {
        UserTraining::firstOrCreate(
            [
                'user_id' => $admin->id,
                'module_id' => $module->id
            ],
            [
                'status' => 'enrolled',
                'final_score' => null,
                'is_certified' => false
            ]
        );
    }
    echo "✓ Admin user '{$admin->name}' enrolled ke semua " . $modules->count() . " modules\n";
} else {
    echo "✗ Admin user tidak ditemukan\n";
}
