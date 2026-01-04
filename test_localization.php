<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== TEST LOCALIZATION FEATURE ===\n\n";

// 1. Check current locale value
echo "1. Current Locale Setting:\n";
echo "─────────────────────────────────\n";
$locale = DB::table('system_settings')->where('key', 'locale')->first();
$timezone = DB::table('system_settings')->where('key', 'timezone')->first();

if ($locale) {
    echo "✓ Locale: {$locale->value} (type: {$locale->type})\n";
} else {
    echo "✗ Locale: NOT FOUND\n";
}

if ($timezone) {
    echo "✓ Timezone: {$timezone->value}\n";
}

// 2. Test Change to English
echo "\n2. Test: Change to English (en):\n";
echo "─────────────────────────────────\n";
DB::table('system_settings')
    ->where('key', 'locale')
    ->update(['value' => 'en', 'updated_at' => now()]);

$locale = DB::table('system_settings')->where('key', 'locale')->first();
echo "✓ Updated to: {$locale->value}\n";

// 3. Test API Response
echo "\n3. Test API Response:\n";
echo "─────────────────────────────────\n";
$controller = new App\Http\Controllers\Admin\SettingsController();
$response = $controller->getSettings();
$data = json_decode($response->getContent(), true);

echo "✓ API returns locale: " . ($data['locale'] ?? 'ERROR') . "\n";
echo "  Type: " . gettype($data['locale']) . "\n";

// 4. Test Change to Indonesian
echo "\n4. Test: Change to Indonesian (id):\n";
echo "─────────────────────────────────\n";
DB::table('system_settings')
    ->where('key', 'locale')
    ->update(['value' => 'id', 'updated_at' => now()]);

$locale = DB::table('system_settings')->where('key', 'locale')->first();
echo "✓ Updated to: {$locale->value}\n";

// 5. Verify API again
$response = $controller->getSettings();
$data = json_decode($response->getContent(), true);
echo "✓ API returns locale: " . ($data['locale'] ?? 'ERROR') . "\n";

// 6. Test Full Settings Save (simulate frontend)
echo "\n5. Test: Simulate Frontend Save:\n";
echo "─────────────────────────────────\n";

// Create a mock request
$testSettings = [
    'app_name' => 'Wondr Learning',
    'app_url' => 'http://localhost',
    'timezone' => 'Asia/Jakarta',
    'locale' => 'en', // Change to English
    'maintenance_mode' => false,
    'enable_two_factor' => true,
    'session_timeout' => 30,
    'max_upload_size' => 50,
    'backup_enabled' => true,
    'backup_frequency' => 'daily',
    'enable_api' => true,
    'api_rate_limit' => 1000,
];

// Simulate saveSettings method
foreach ($testSettings as $key => $value) {
    $type = 'string';
    if (is_bool($value)) {
        $type = 'boolean';
        $value = $value ? 'true' : 'false';
    } elseif (is_int($value)) {
        $type = 'integer';
    }

    $group = 'general';
    if (in_array($key, ['enable_two_factor', 'session_timeout'])) {
        $group = 'security';
    } elseif (in_array($key, ['max_upload_size', 'backup_enabled', 'backup_frequency'])) {
        $group = 'data';
    } elseif (in_array($key, ['enable_api', 'api_rate_limit'])) {
        $group = 'api';
    }

    DB::table('system_settings')->updateOrInsert(
        ['key' => $key],
        [
            'value' => $value,
            'type' => $type,
            'group' => $group,
            'updated_at' => now(),
        ]
    );
}

echo "✓ Saved all settings with locale='en'\n";

// 7. Verify the save
$response = $controller->getSettings();
$data = json_decode($response->getContent(), true);
echo "✓ Final locale from API: " . ($data['locale'] ?? 'ERROR') . "\n";

echo "\n═══════════════════════════════════\n";
echo "DIAGNOSIS:\n";
echo "═══════════════════════════════════\n";

if ($data['locale'] === 'en') {
    echo "✅ Localization WORKS!\n";
    echo "   Locale berhasil diubah ke 'en'\n";
} else {
    echo "❌ PROBLEM DETECTED!\n";
    echo "   Expected: 'en'\n";
    echo "   Got: " . ($data['locale'] ?? 'NULL') . "\n";
}

echo "\n📝 CATATAN:\n";
echo "Setelah save settings, perlu REFRESH PAGE\n";
echo "agar useEffect() load ulang data dari API.\n";
echo "\nCara test:\n";
echo "1. Klik button English 🇺🇸\n";
echo "2. Klik 'Save Configuration'\n";
echo "3. REFRESH halaman (F5)\n";
echo "4. Button English harus selected (bg-white)\n";
