<?php

/**
 * Script untuk mengecek status module dan filter akses
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== CEK STATUS MODULE ===\n\n";

$modules = DB::table('modules')->select('id', 'title', 'is_active', 'approval_status', 'category')->get();

echo "Semua Modules:\n";
echo str_repeat("-", 100) . "\n";
foreach ($modules as $m) {
    $status = $m->is_active ? '✅ Aktif' : '❌ Nonaktif';
    $approval = $m->approval_status ?? 'N/A';
    echo "  ID: {$m->id} | {$m->title}\n";
    echo "       Status: {$status} | Approval: {$approval} | Category: {$m->category}\n\n";
}

echo "\n=== CEK FILTER DI CATALOG (TrainingController@catalog) ===\n";
echo "Filter yang digunakan: is_active = true AND approval_status = 'approved'\n\n";

$catalogModules = DB::table('modules')
    ->where('is_active', true)
    ->where('approval_status', 'approved')
    ->get();
    
echo "Modules yang muncul di Catalog: " . count($catalogModules) . "\n";
foreach ($catalogModules as $m) {
    echo "  ✅ {$m->title} (ID: {$m->id})\n";
}

// Module yang TIDAK muncul karena filter
$hiddenModules = DB::table('modules')
    ->where(function($q) {
        $q->where('is_active', false)
          ->orWhere('approval_status', '!=', 'approved')
          ->orWhereNull('approval_status');
    })
    ->get();

if (count($hiddenModules) > 0) {
    echo "\n\nModules yang TERSEMBUNYI dari Catalog (tidak memenuhi filter):\n";
    echo str_repeat("-", 100) . "\n";
    foreach ($hiddenModules as $m) {
        $reason = [];
        if (!$m->is_active) $reason[] = "is_active = false";
        if ($m->approval_status !== 'approved') $reason[] = "approval_status = '{$m->approval_status}'";
        echo "  ❌ {$m->title} (ID: {$m->id})\n";
        echo "       Alasan: " . implode(", ", $reason) . "\n\n";
    }
}

echo "\n=== CEK AKSES USER KE MODULE ===\n";
echo str_repeat("-", 100) . "\n";

// Ambil user yang bukan admin
$regularUsers = DB::table('users')->where('role', '!=', 'admin')->limit(5)->get();

foreach ($regularUsers as $user) {
    echo "\nUser: {$user->name} ({$user->email})\n";
    
    // Cek training yang dimiliki user
    $userTrainings = DB::table('user_trainings')
        ->join('modules', 'user_trainings.module_id', '=', 'modules.id')
        ->where('user_trainings.user_id', $user->id)
        ->select('modules.id', 'modules.title', 'modules.is_active', 'modules.approval_status', 'user_trainings.status')
        ->get();
    
    if (count($userTrainings) > 0) {
        foreach ($userTrainings as $ut) {
            $moduleActive = $ut->is_active ? '✅' : '❌';
            $approved = $ut->approval_status === 'approved' ? '✅' : '❌';
            echo "  📚 {$ut->title}\n";
            echo "       Training Status: {$ut->status} | Module Active: {$moduleActive} | Approved: {$approved}\n";
            
            // Cek apakah bisa diakses
            if ($ut->is_active && $ut->approval_status === 'approved') {
                echo "       ✅ User BISA mengakses module ini\n";
            } else {
                echo "       ❌ User TIDAK BISA akses: Module tidak aktif/belum approved\n";
            }
        }
    } else {
        echo "  ⚠️ User tidak memiliki training assignment\n";
    }
}

echo "\n\n=== REKOMENDASI ===\n";
echo str_repeat("=", 100) . "\n";

// Hitung module yang bermasalah
$problemModules = DB::table('modules')
    ->join('user_trainings', 'modules.id', '=', 'user_trainings.module_id')
    ->where(function($q) {
        $q->where('modules.is_active', false)
          ->orWhere('modules.approval_status', '!=', 'approved')
          ->orWhereNull('modules.approval_status');
    })
    ->select('modules.id', 'modules.title', 'modules.is_active', 'modules.approval_status')
    ->distinct()
    ->get();

if (count($problemModules) > 0) {
    echo "\n❌ DITEMUKAN MASALAH!\n";
    echo "   Ada " . count($problemModules) . " module yang sudah di-assign ke user tapi:\n";
    echo "   - is_active = false, atau\n";
    echo "   - approval_status != 'approved'\n\n";
    
    echo "   Module bermasalah:\n";
    foreach ($problemModules as $pm) {
        echo "   - {$pm->title} (ID: {$pm->id}) - is_active: " . ($pm->is_active ? 'true' : 'false') . ", approval: {$pm->approval_status}\n";
    }
    
    echo "\n   SOLUSI: Update module agar is_active = true AND approval_status = 'approved'\n";
} else {
    echo "\n✅ Semua module yang di-assign sudah aktif dan approved.\n";
    echo "   User seharusnya bisa mengakses semua training mereka.\n";
}

echo "\n";
