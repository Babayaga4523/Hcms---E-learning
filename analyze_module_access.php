<?php

/**
 * Script untuk menganalisis masalah akses modul
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== ANALISIS AKSES MODUL PEMBELAJARAN ===\n\n";

// 1. Cek ModuleAssignment yang tidak ada di UserTraining (Orphaned)
echo "1. ModuleAssignment TANPA UserTraining (User tidak bisa akses padahal sudah diassign):\n";
echo str_repeat("-", 80) . "\n";

$orphaned = DB::select("
    SELECT ma.id, ma.module_id, ma.user_id, ma.status as assignment_status,
           u.name as user_name, u.email,
           m.title as module_title
    FROM module_assignments ma
    LEFT JOIN user_trainings ut ON ma.module_id = ut.module_id AND ma.user_id = ut.user_id
    LEFT JOIN users u ON ma.user_id = u.id
    LEFT JOIN modules m ON ma.module_id = m.id
    WHERE ut.id IS NULL
");

if (count($orphaned) > 0) {
    foreach ($orphaned as $o) {
        echo "   ❌ User: {$o->user_name} ({$o->email})\n";
        echo "      Module: {$o->module_title} (ID: {$o->module_id})\n";
        echo "      Assignment Status: {$o->assignment_status}\n\n";
    }
    echo "   TOTAL ORPHANED: " . count($orphaned) . " user-module pairs\n";
    echo "   INI ADALAH MASALAH! User-user ini sudah di-assign tapi tidak bisa akses.\n";
} else {
    echo "   ✅ Tidak ada orphaned records (semua sudah tersinkronisasi)\n";
}

// 2. Statistics
echo "\n\n2. STATISTIK TOTAL:\n";
echo str_repeat("-", 80) . "\n";

$maCount = DB::table('module_assignments')->count();
$utCount = DB::table('user_trainings')->count();
$modulesCount = DB::table('modules')->where('is_active', true)->count();
$usersCount = DB::table('users')->count();

echo "   - Total ModuleAssignments: {$maCount}\n";
echo "   - Total UserTrainings: {$utCount}\n";
echo "   - Total Active Modules: {$modulesCount}\n";
echo "   - Total Users: {$usersCount}\n";

// 3. Sample data dari user_trainings
echo "\n\n3. SAMPLE DATA USER TRAININGS (yang bisa diakses user):\n";
echo str_repeat("-", 80) . "\n";

$samples = DB::table('user_trainings')
    ->join('users', 'user_trainings.user_id', '=', 'users.id')
    ->join('modules', 'user_trainings.module_id', '=', 'modules.id')
    ->select('user_trainings.id', 'users.name as user_name', 'modules.title', 'user_trainings.status')
    ->orderBy('user_trainings.created_at', 'desc')
    ->limit(10)
    ->get();

if (count($samples) > 0) {
    foreach ($samples as $s) {
        $statusIcon = $s->status === 'completed' ? '✅' : ($s->status === 'in_progress' ? '🔄' : '📋');
        echo "   {$statusIcon} {$s->user_name} | {$s->title} | Status: {$s->status}\n";
    }
} else {
    echo "   ⚠️ Tidak ada data di user_trainings\n";
}

// 4. Cek apakah ada module yang aktif tapi tidak ada assignment
echo "\n\n4. MODULES AKTIF TANPA ASSIGNMENT:\n";
echo str_repeat("-", 80) . "\n";

$unassignedModules = DB::select("
    SELECT m.id, m.title
    FROM modules m
    WHERE m.is_active = 1
    AND NOT EXISTS (SELECT 1 FROM module_assignments ma WHERE ma.module_id = m.id)
    LIMIT 10
");

if (count($unassignedModules) > 0) {
    foreach ($unassignedModules as $m) {
        echo "   📌 {$m->title} (ID: {$m->id}) - Belum ada user yang diassign\n";
    }
} else {
    echo "   ✅ Semua module aktif sudah memiliki assignment\n";
}

// 5. Cek user yang tidak punya training sama sekali
echo "\n\n5. USER TANPA TRAINING (tidak muncul di My Trainings):\n";
echo str_repeat("-", 80) . "\n";

$usersNoTraining = DB::select("
    SELECT u.id, u.name, u.email, u.role
    FROM users u
    WHERE NOT EXISTS (SELECT 1 FROM user_trainings ut WHERE ut.user_id = u.id)
    LIMIT 10
");

if (count($usersNoTraining) > 0) {
    foreach ($usersNoTraining as $u) {
        echo "   ⚠️ {$u->name} ({$u->email}) - Role: {$u->role}\n";
    }
    echo "\n   Total users tanpa training: " . count(DB::select("SELECT u.id FROM users u WHERE NOT EXISTS (SELECT 1 FROM user_trainings ut WHERE ut.user_id = u.id)")) . "\n";
} else {
    echo "   ✅ Semua user memiliki setidaknya satu training\n";
}

echo "\n\n=== KESIMPULAN ===\n";
echo str_repeat("=", 80) . "\n";

$orphanedCount = count($orphaned);
if ($orphanedCount > 0) {
    echo "❌ DITEMUKAN MASALAH!\n";
    echo "   Ada {$orphanedCount} user-module pairs yang sudah di-assign di ModuleAssignment\n";
    echo "   tapi TIDAK ada di UserTraining, sehingga user tidak bisa mengakses training.\n\n";
    echo "   SOLUSI: Jalankan script sync_assignments.php untuk memperbaiki:\n";
    echo "   > php sync_assignments.php\n";
} else {
    echo "✅ Data sudah tersinkronisasi dengan baik.\n";
    echo "   Jika user masih tidak bisa akses, periksa:\n";
    echo "   1. Apakah module sudah aktif (is_active = true)?\n";
    echo "   2. Apakah user sudah login dengan akun yang benar?\n";
    echo "   3. Apakah ada filter status di halaman My Trainings?\n";
}

echo "\n";
