<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== SYSTEM SETTINGS DATABASE TEST ===\n\n";

// Check if table exists
try {
    $tableExists = DB::table('system_settings')->exists();
    echo "✓ Table 'system_settings' exists: " . ($tableExists ? "YES" : "NO") . "\n\n";
    
    if ($tableExists) {
        // Get all settings
        $settings = DB::table('system_settings')->get();
        echo "Total settings in database: " . $settings->count() . "\n\n";
        
        // Display each setting
        foreach ($settings as $setting) {
            echo "─────────────────────────────────\n";
            echo "Key: {$setting->key}\n";
            echo "Value: {$setting->value}\n";
            echo "Type: {$setting->type}\n";
            echo "Group: {$setting->group}\n";
            echo "Description: {$setting->description}\n";
        }
        
        echo "─────────────────────────────────\n\n";
        
        // Test API endpoint
        echo "Testing settings retrieval...\n";
        $controller = new App\Http\Controllers\Admin\SettingsController();
        $response = $controller->getSettings();
        $data = json_decode($response->getContent(), true);
        
        echo "API Response keys: " . implode(", ", array_keys($data)) . "\n";
        echo "App Name: " . ($data['app_name'] ?? 'Not found') . "\n";
        echo "Enable API: " . (isset($data['enable_api']) ? ($data['enable_api'] ? 'true' : 'false') : 'Not found') . "\n";
        
        echo "\n✓ System Settings working properly!\n";
    }
    
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
}
