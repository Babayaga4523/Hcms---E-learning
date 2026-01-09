<?php

require __DIR__ . '/vendor/autoload.php';

use Illuminate\Support\Facades\DB;

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\\Contracts\\Console\\Kernel')->bootstrap();

$db = DB::table('questions')->where('question_type', 'pre_test')->orWhere('question_type', 'post_test')->count();
echo "Jumlah data lama: $db\n";
if ($db > 0) {
    DB::table('questions')->where('question_type', 'pre_test')->update(['question_type' => 'pretest']);
    DB::table('questions')->where('question_type', 'post_test')->update(['question_type' => 'posttest']);
    echo "Sudah update semua data lama ke format baru.\n";
} else {
    echo "Tidak ada data lama yang perlu diupdate.\n";
}
