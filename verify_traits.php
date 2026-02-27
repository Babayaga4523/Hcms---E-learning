<?php
require 'vendor/autoload.php';

// Check Controller has the trait
$controller = new ReflectionClass('App\Http\Controllers\Controller');
$traits = $controller->getTraitNames();

echo "=== Controller Trait Verification ===" . PHP_EOL;
echo "Traits found: " . implode(', ', $traits) . PHP_EOL;

if (in_array('Illuminate\Foundation\Auth\Access\AuthorizesRequests', $traits)) {
    echo "✓ SUCCESS: authorize() method is NOW available in all controllers!" . PHP_EOL;
} else {
    echo "✗ ERROR: AuthorizesRequests trait not found" . PHP_EOL;
}

// Check if method exists
$methods = (new ReflectionClass('App\Http\Controllers\Controller'))->getMethods();
$hasAuthorize = false;
foreach ($methods as $method) {
    if ($method->name === 'authorize') {
        $hasAuthorize = true;
        break;
    }
}

echo "Has authorize() method: " . ($hasAuthorize ? "YES" : "NO") . PHP_EOL;
