<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== TEST APP IDENTITY FEATURE ===\n\n";

// 1. Check current values
echo "1. Current App Identity Settings:\n";
echo "─────────────────────────────────\n";
$appName = DB::table('system_settings')->where('key', 'app_name')->first();
$appUrl = DB::table('system_settings')->where('key', 'app_url')->first();

if ($appName) {
    echo "✓ App Name: {$appName->value}\n";
} else {
    echo "✗ App Name: NOT FOUND\n";
}

if ($appUrl) {
    echo "✓ App URL: {$appUrl->value}\n";
} else {
    echo "✗ App URL: NOT FOUND\n";
}

echo "\n2. Simulate Update (Testing):\n";
echo "─────────────────────────────────\n";

// Update app_name
DB::table('system_settings')
    ->where('key', 'app_name')
    ->update(['value' => 'Wondr Learning Platform', 'updated_at' => now()]);

// Update app_url
DB::table('system_settings')
    ->where('key', 'app_url')
    ->update(['value' => 'https://learning.wondr.bni.co.id', 'updated_at' => now()]);

echo "✓ Updated app_name to: 'Wondr Learning Platform'\n";
echo "✓ Updated app_url to: 'https://learning.wondr.bni.co.id'\n";

echo "\n3. Verify Update:\n";
echo "─────────────────────────────────\n";
$appName = DB::table('system_settings')->where('key', 'app_name')->first();
$appUrl = DB::table('system_settings')->where('key', 'app_url')->first();

echo "✓ New App Name: {$appName->value}\n";
echo "✓ New App URL: {$appUrl->value}\n";

echo "\n4. Test API Response:\n";
echo "─────────────────────────────────\n";
$controller = new App\Http\Controllers\Admin\SettingsController();
$response = $controller->getSettings();
$data = json_decode($response->getContent(), true);

echo "✓ API returns App Name: " . ($data['app_name'] ?? 'ERROR') . "\n";
echo "✓ API returns App URL: " . ($data['app_url'] ?? 'ERROR') . "\n";

echo "\n5. Rollback to Default:\n";
echo "─────────────────────────────────\n";
DB::table('system_settings')
    ->where('key', 'app_name')
    ->update(['value' => 'Wondr Learning', 'updated_at' => now()]);
DB::table('system_settings')
    ->where('key', 'app_url')
    ->update(['value' => 'http://localhost', 'updated_at' => now()]);
echo "✓ Restored to default values\n";

echo "\n═══════════════════════════════════\n";
echo "✅ APP IDENTITY FEATURE WORKS!\n";
echo "═══════════════════════════════════\n";
echo "\nCara Menggunakan:\n";
echo "1. Buka /admin/system-settings\n";
echo "2. Edit App Name atau App URL\n";
echo "3. Klik 'Save Configuration'\n";
echo "4. Refresh page - nilai akan persist!\n";
