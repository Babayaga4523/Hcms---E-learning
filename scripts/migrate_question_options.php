<?php

require __DIR__ . '/../vendor/autoload.php';

use Illuminate\Support\Facades\DB;

$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make('Illuminate\\Contracts\\Console\\Kernel')->bootstrap();

$questions = DB::table('questions')->select('id','option_a','option_b','option_c','option_d')->get();
$updated = 0;
foreach ($questions as $q) {
    $options = [];
    if (!is_null($q->option_a)) $options[] = ['label' => 'a', 'text' => $q->option_a];
    if (!is_null($q->option_b)) $options[] = ['label' => 'b', 'text' => $q->option_b];
    if (!is_null($q->option_c)) $options[] = ['label' => 'c', 'text' => $q->option_c];
    if (!is_null($q->option_d)) $options[] = ['label' => 'd', 'text' => $q->option_d];

    if (!empty($options)) {
        DB::table('questions')->where('id', $q->id)->update(['options' => json_encode($options)]);
        $updated++;
    }
}

echo "Migration complete. Updated $updated questions with options JSON.\n";
