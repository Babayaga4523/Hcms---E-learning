<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Check database schema
$schemaInfo = \DB::select("SELECT COLUMN_NAME, COLUMN_TYPE, DATA_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'user_trainings' AND COLUMN_NAME = 'is_certified'");

echo "=== DATABASE SCHEMA ===\n";
if (!empty($schemaInfo)) {
    foreach ($schemaInfo as $col) {
        echo "Column: " . $col->COLUMN_NAME . "\n";
        echo "  Type: " . $col->COLUMN_TYPE . "\n";
        echo "  Data Type: " . $col->DATA_TYPE . "\n";
        echo "  Nullable: " . $col->IS_NULLABLE . "\n";
    }
} else {
    echo "Could not find column info\n";
}

// Check all values in the column
echo "\n=== ALL is_certified VALUES IN DATABASE ===\n";
$values = \DB::select("SELECT DISTINCT is_certified FROM user_trainings ORDER BY is_certified");
foreach ($values as $v) {
    echo "Value: " . var_export($v->is_certified, true);
    echo " (raw: " . $v->is_certified . ", type: " . gettype($v->is_certified) . ")\n";
}

// Check what happens when status = 'completed'
echo "\n=== COMPLETED TRAININGS WITH is_certified VALUES ===\n";
$completed = \DB::table('user_trainings')
    ->where('status', 'completed')
    ->select('id', 'user_id', 'status', 'is_certified')
    ->limit(10)
    ->get();
echo "Count: " . count($completed) . "\n";
foreach ($completed as $c) {
    echo "ID: " . $c->id . " | is_certified: " . var_export($c->is_certified, true) . " (type: " . gettype($c->is_certified) . ")\n";
}
