<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$certId = $argv[1] ?? 7;
$userId = $argv[2] ?? null;

use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use App\Http\Controllers\User\CertificateController;
use App\Models\Certificate;

if ($userId) {
    Auth::loginUsingId($userId);
}

$cert = Certificate::find($certId);
if (!$cert) {
    echo "CERT_NOT_FOUND\n";
    exit(1);
}

$controller = new CertificateController();

try {
    $response = $controller->download($certId);

    // If response is JsonResponse, print its content
    if (method_exists($response, 'getStatusCode')) {
        $status = $response->getStatusCode();
        echo "Response status: $status\n";
        $content = method_exists($response, 'getContent') ? $response->getContent() : '';
        echo "Response content: " . substr($content,0,1000) . "\n";
    } else {
        echo "Received response of type: " . get_class($response) . "\n";
    }
} catch (\Exception $e) {
    echo "Exception during download: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}

// Print the latest log entries matching our certificate id
$logs = @file_get_contents(__DIR__ . '/../storage/logs/laravel.log');
if ($logs !== false) {
    echo "\n---- recent logs ----\n";
    $lines = explode("\n", $logs);
    $matches = array_filter($lines, fn($l) => str_contains($l, "certificate-{$certId}") || str_contains($l, "Certificate HTML saved") || str_contains($l, "Failed to download certificate") || str_contains($l, "DomPDF failed"));
    foreach ($matches as $m) echo $m . "\n";
    echo "---- end logs ----\n";
} else {
    echo "No log file found or cannot read logs\n";
}
