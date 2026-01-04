<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== DEBUG: API ENDPOINT TEST ===\n\n";

// Simulate API call
$controller = new App\Http\Controllers\Admin\SettingsController();
$response = $controller->getSettings();
$data = json_decode($response->getContent(), true);

echo "API Response Content:\n";
echo "─────────────────────────────────\n";
foreach ($data as $key => $value) {
    $display = is_bool($value) ? ($value ? 'true' : 'false') : $value;
    echo sprintf("%-20s : %s\n", $key, $display);
}

echo "\n\nDatabase Values:\n";
echo "─────────────────────────────────\n";
$settings = DB::table('system_settings')->get();
foreach ($settings as $setting) {
    echo sprintf("%-20s : %s (type: %s)\n", $setting->key, $setting->value, $setting->type);
}
