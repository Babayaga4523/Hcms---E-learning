<?php
// scripts/check_modules_difficulty.php
// Print column definition for modules.difficulty
require __DIR__ . '/../vendor/autoload.php';

use Illuminate\Database\Capsule\Manager as Capsule;
use Illuminate\Support\Str;

// bootstrap minimal laravel environment
$appPath = dirname(__DIR__);
$dotenv = Dotenv\Dotenv::createImmutable($appPath);
$dotenv->safeLoad();

$capsule = new Capsule;
$capsule->addConnection([
    'driver' => $_ENV['DB_CONNECTION'] ?? 'mysql',
    'host' => $_ENV['DB_HOST'] ?? '127.0.0.1',
    'database' => $_ENV['DB_DATABASE'] ?? 'forge',
    'username' => $_ENV['DB_USERNAME'] ?? 'forge',
    'password' => $_ENV['DB_PASSWORD'] ?? '',
    'charset' => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
]);
$capsule->setAsGlobal();
$db = $capsule->getConnection();
$driver = $db->getDriverName();

echo "DB Driver: $driver\n";

if ($driver === 'sqlite') {
    $row = $db->select("PRAGMA table_info('modules')");
    foreach ($row as $r) {
        if ($r->name === 'difficulty') {
            echo "Found difficulty column (sqlite): type={$r->type}\n";
            exit(0);
        }
    }
    echo "difficulty column not found in sqlite modules table.\n";
    exit(1);
}

// For MySQL
$row = $db->select("SHOW COLUMNS FROM modules LIKE 'difficulty'");
if (count($row) === 0) {
    echo "No difficulty column in modules table.\n";
    exit(1);
}
$col = $row[0];
echo "Field: {$col->Field}\n";
echo "Type: {$col->Type}\n";
echo "Null: {$col->Null}\n";
echo "Default: {$col->Default}\n";
if (Str::startsWith($col->Type, 'enum(')) {
    $vals = trim(substr($col->Type, 5, -1));
    $parts = array_map(function($v){ return trim($v, "'\""); }, explode(',', $vals));
    echo "Enum values: " . implode(', ', $parts) . "\n";
}
