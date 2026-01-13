<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->bootstrap();

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

echo "\n=== ADMIN ROUTES RUNTIME CHECK ===\n\n";

$routes = Route::getRoutes();
$adminRoutes = [];
foreach ($routes as $route) {
    $uri = $route->uri();
    if (str_starts_with($uri, 'admin/') || str_starts_with($uri, 'api/admin/')) {
        $adminRoutes[] = [
            'uri' => $uri,
            'methods' => $route->methods(),
            'action' => $route->getActionName(),
        ];
    }
}

// Attempt to authenticate as an admin user
$adminUser = \App\Models\User::where('role','admin')->first();
if (!$adminUser) {
    // Create a local admin for checks
    $adminUser = \App\Models\User::factory()->create(['role' => 'admin', 'email' => 'local-admin@example.com']);
}
\Illuminate\Support\Facades\Auth::login($adminUser);

$report = [];
foreach ($adminRoutes as $r) {
    // Only GET endpoints for now
    if (!in_array('GET', $r['methods'])) continue;

    $url = '/' . $r['uri'];
    $request = Request::create($url, 'GET');

    try {
        $response = $kernel->handle($request);
        $status = $response->getStatusCode();
        $report[] = [ 'uri' => $r['uri'], 'status' => $status ];
        echo "{$url} -> {$status}\n";
    } catch (\Exception $e) {
        echo "ERROR: {$url} -> {$e->getMessage()}\n";
        $report[] = [ 'uri' => $r['uri'], 'status' => 'ERROR', 'error' => $e->getMessage() ];
    }
}

$errors = array_filter($report, fn($r) => $r['status'] !== 200 && $r['status'] !== '302');

echo "\nSummary: total checked: " . count($report) . ", errors: " . count($errors) . "\n";

if (!empty($errors)) {
    echo "\nErrors listing:\n";
    foreach ($errors as $e) {
        echo " - {$e['uri']} : {$e['status']}\n";
    }
}

echo "\n";
