<?php
require_once 'vendor/autoload.php';
require_once 'bootstrap/app.php';

use App\Models\Certificate;
use App\Models\Module;

// Find certificates with null or empty training_title
$certs = Certificate::whereNull('training_title')
    ->orWhere('training_title', '')
    ->get();

echo "Found " . $certs->count() . " certificates with null/empty training_title\n\n";

foreach ($certs as $cert) {
    $module = Module::find($cert->module_id);
    echo "Certificate ID: {$cert->id}\n";
    echo "  User ID: {$cert->user_id}\n";
    echo "  Module ID: {$cert->module_id}\n";
    echo "  Current Title: " . ($cert->training_title ?? 'NULL') . "\n";
    echo "  Module Title: " . ($module?->title ?? 'NOT FOUND') . "\n";
    echo "  Issued At: {$cert->issued_at}\n\n";
}

// Fix certificates by updating them with module title
if ($certs->count() > 0) {
    echo "Fixing " . $certs->count() . " certificates...\n\n";
    
    foreach ($certs as $cert) {
        $module = Module::find($cert->module_id);
        if ($module && $module->title) {
            $cert->update(['training_title' => $module->title]);
            echo "✓ Updated Certificate {$cert->id} with title: {$module->title}\n";
        } else {
            $fallback = 'Program Pelatihan';
            $cert->update(['training_title' => $fallback]);
            echo "✓ Updated Certificate {$cert->id} with fallback: {$fallback}\n";
        }
    }
    
    echo "\nAll certificates fixed!\n";
} else {
    echo "No certificates to fix.\n";
}
?>
