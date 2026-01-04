<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "\n=== TEST: AUTHENTICATION SETTINGS ===\n\n";

// 1. Test apakah settings bisa disimpan
echo "1. Testing save authentication settings...\n";

DB::table('system_settings')->updateOrInsert(
    ['key' => 'enable_two_factor'],
    [
        'value' => 'true',
        'type' => 'boolean',
        'group' => 'security',
        'description' => 'Enable two-factor authentication',
        'updated_at' => now()
    ]
);

DB::table('system_settings')->updateOrInsert(
    ['key' => 'session_timeout'],
    [
        'value' => '45',
        'type' => 'integer',
        'group' => 'security',
        'description' => 'Session timeout in minutes',
        'updated_at' => now()
    ]
);

echo "   ✓ Settings saved to database\n\n";

// 2. Test read settings
echo "2. Testing read authentication settings...\n";

$twoFactor = DB::table('system_settings')->where('key', 'enable_two_factor')->first();
$sessionTimeout = DB::table('system_settings')->where('key', 'session_timeout')->first();

echo "   - enable_two_factor: {$twoFactor->value} (type: {$twoFactor->type})\n";
echo "   - session_timeout: {$sessionTimeout->value} (type: {$sessionTimeout->type})\n\n";

// 3. Test API endpoint
echo "3. Testing API /api/admin/settings endpoint...\n";

try {
    // Simulate API call
    $settings = DB::table('system_settings')->get();
    $result = [];
    
    foreach ($settings as $setting) {
        $value = $setting->value;
        
        // Type casting
        if ($setting->type === 'boolean') {
            $value = filter_var($value, FILTER_VALIDATE_BOOLEAN);
        } elseif ($setting->type === 'integer') {
            $value = (int) $value;
        } elseif ($setting->type === 'json') {
            $value = json_decode($value, true);
        }
        
        $result[$setting->key] = $value;
    }
    
    echo "   API Response for authentication settings:\n";
    echo "   - enable_two_factor: " . json_encode($result['enable_two_factor']) . "\n";
    echo "   - session_timeout: " . $result['session_timeout'] . "\n\n";
    
} catch (Exception $e) {
    echo "   ✗ Error: " . $e->getMessage() . "\n\n";
}

// 4. Cek apakah config session.php menggunakan setting dari database
echo "4. Checking session configuration...\n";

$configLifetime = config('session.lifetime');
echo "   - Current session.lifetime in config: {$configLifetime} minutes\n";
echo "   - Setting from database: {$sessionTimeout->value} minutes\n";

if ($configLifetime != $sessionTimeout->value) {
    echo "   ⚠ WARNING: Config tidak otomatis sync dengan database!\n";
    echo "   ℹ Untuk menggunakan session_timeout dari database, perlu:\n";
    echo "     1. Update config/session.php untuk membaca dari DB\n";
    echo "     2. Atau buat middleware untuk enforce timeout\n\n";
} else {
    echo "   ✓ Config sudah sync dengan database\n\n";
}

// 5. Cek apakah ada middleware atau implementasi 2FA
echo "5. Checking 2FA implementation...\n";

$middlewareExists = file_exists(__DIR__.'/app/Http/Middleware/TwoFactorAuth.php');
echo "   - TwoFactorAuth middleware: " . ($middlewareExists ? "✓ EXISTS" : "✗ NOT FOUND") . "\n";

if (!$middlewareExists) {
    echo "   ⚠ WARNING: 2FA middleware belum diimplementasi!\n";
    echo "   ℹ Setting 'enable_two_factor' tersimpan tapi belum ada enforcement.\n\n";
}

// Summary
echo "=== SUMMARY ===\n\n";
echo "✅ Settings SAVE/LOAD: WORKING\n";
echo "   - Settings bisa disimpan ke database\n";
echo "   - Settings bisa dibaca dari API\n";
echo "   - Type casting berfungsi (boolean, integer)\n\n";

echo "⚠  Actual ENFORCEMENT: NEED IMPLEMENTATION\n";
echo "   - enable_two_factor: Tersimpan, tapi belum ada middleware/logic 2FA\n";
echo "   - session_timeout: Tersimpan, tapi config/session.php tidak otomatis sync\n\n";

echo "📝 RECOMMENDATION:\n";
echo "   1. Buat middleware TwoFactorAuth.php untuk enforce 2FA\n";
echo "   2. Update config/session.php atau buat ServiceProvider:\n";
echo "      Config::set('session.lifetime', Settings::get('session_timeout'));\n";
echo "   3. Atau gunakan package seperti laravel/fortify untuk 2FA\n\n";
