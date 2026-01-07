<?php

/**
 * Script untuk memeriksa dan membersihkan UserTrainings yang tidak memiliki ModuleAssignment
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== CEK SINKRONISASI DATA ===\n\n";

$ma = DB::table('module_assignments')->count();
$ut = DB::table('user_trainings')->count();

echo "ModuleAssignments: {$ma}\n";
echo "UserTrainings: {$ut}\n\n";

echo "=== USER TRAININGS TANPA MODULE ASSIGNMENT (Orphaned) ===\n";
echo str_repeat("-", 80) . "\n";

$orphaned = DB::select("
    SELECT ut.id, ut.user_id, ut.module_id, ut.status, u.name as user_name, m.title
    FROM user_trainings ut
    LEFT JOIN module_assignments ma ON ut.module_id = ma.module_id AND ut.user_id = ma.user_id
    LEFT JOIN users u ON ut.user_id = u.id
    LEFT JOIN modules m ON ut.module_id = m.id
    WHERE ma.id IS NULL
");

if (count($orphaned) > 0) {
    foreach ($orphaned as $o) {
        echo "  ❌ User: {$o->user_name} (ID: {$o->user_id})\n";
        echo "     Module: {$o->title} (ID: {$o->module_id})\n";
        echo "     Status: {$o->status}\n";
        echo "     UserTraining ID: {$o->id}\n\n";
    }
    echo "\nTotal orphaned UserTrainings: " . count($orphaned) . "\n";
    echo "INI ADALAH MASALAH! Record-record ini tidak punya assignment tapi masih muncul di My Trainings.\n\n";
    
    // Ask to clean up
    echo "=== MEMBERSIHKAN ORPHANED RECORDS ===\n";
    
    $deletedCount = DB::table('user_trainings')
        ->whereNotExists(function($query) {
            $query->select(DB::raw(1))
                  ->from('module_assignments')
                  ->whereColumn('module_assignments.module_id', 'user_trainings.module_id')
                  ->whereColumn('module_assignments.user_id', 'user_trainings.user_id');
        })
        ->delete();
    
    echo "✅ Berhasil menghapus {$deletedCount} orphaned UserTraining records.\n";
    echo "   User tidak akan melihat training yang sudah dihapus aksesnya.\n";
} else {
    echo "  ✅ Tidak ada orphaned records. Data sudah tersinkronisasi.\n";
}

echo "\n=== VERIFIKASI SETELAH PEMBERSIHAN ===\n";
$maAfter = DB::table('module_assignments')->count();
$utAfter = DB::table('user_trainings')->count();
echo "ModuleAssignments: {$maAfter}\n";
echo "UserTrainings: {$utAfter}\n";

echo "\nDone!\n";
