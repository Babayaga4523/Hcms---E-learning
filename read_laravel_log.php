<?php
$path = __DIR__ . '/storage/logs/laravel.log';
if (!file_exists($path)) {
    echo "Log file not found\n";
    exit(1);
}
$lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
$last = array_slice($lines, -120);
foreach ($last as $l) echo $l . PHP_EOL;
?>