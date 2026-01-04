<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

$users = \App\Models\User::where('name', 'like', '%budi%')->get();
$modules = \App\Models\Module::where('title', 'like', '%AML%')->get();
$trainings = \App\Models\UserTraining::count();

echo "=== SEARCH TEST DATA ===\n";
echo "Users with 'budi': " . count($users) . "\n";
foreach ($users as $u) {
    echo "  - " . $u->name . " (NIP: " . $u->nip . ", Email: " . $u->email . ")\n";
}

echo "\nModules with 'AML': " . count($modules) . "\n";
foreach ($modules as $m) {
    echo "  - " . $m->title . "\n";
}

echo "\nTotal Trainings in DB: " . $trainings . "\n";
echo "=== END TEST ===\n";
