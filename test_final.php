<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== FINAL TEST: SETTINGS PERSISTENCE ===\n\n";

// 1. Set locale to English in database
echo "1. Setting locale to 'en' in database...\n";
DB::table('system_settings')
    ->where('key', 'locale')
    ->update(['value' => 'en', 'updated_at' => now()]);
echo "✓ Done\n\n";

// 2. Check API response
echo "2. Checking API response:\n";
$controller = new App\Http\Controllers\Admin\SettingsController();
$response = $controller->getSettings();
$data = json_decode($response->getContent(), true);
echo "   locale = " . $data['locale'] . "\n\n";

// 3. Verify it persists
echo "3. Simulating page refresh (re-query API):\n";
$response2 = $controller->getSettings();
$data2 = json_decode($response2->getContent(), true);
echo "   locale = " . $data2['locale'] . "\n\n";

if ($data['locale'] === 'en' && $data2['locale'] === 'en') {
    echo "✅ SUCCESS! Locale persists correctly.\n";
    echo "   Frontend akan load 'en' dari API.\n";
} else {
    echo "❌ FAILED! Data tidak persist.\n";
}

echo "\n═══════════════════════════════════\n";
echo "INSTRUKSI TESTING:\n";
echo "═══════════════════════════════════\n";
echo "1. Refresh halaman /admin/system-settings\n";
echo "2. Tunggu spinner loading selesai\n";
echo "3. Button 🇺🇸 English harus selected (bg-white)\n";
echo "4. Klik button 🇮🇩 Indonesia\n";
echo "5. Klik 'Save Configuration'\n";
echo "6. Refresh halaman (F5)\n";
echo "7. Button 🇮🇩 Indonesia harus selected\n";
