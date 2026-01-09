<?php
require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make('Illuminate\\Contracts\\Console\\Kernel')->bootstrap();

use App\Models\User;

$user = User::find(7);
if (! $user) {
    echo "User 7 not found\n";
    exit(1);
}

$controller = new App\Http\Controllers\DashboardController();
$ref = new ReflectionMethod($controller, 'getRecentActivity');
// Note: setAccessible() is deprecated in PHP 8.1+, invoke() works directly now
try {
    $result = $ref->invoke($controller, $user);
    echo "OK\n";
    print_r($result->toArray());
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}
