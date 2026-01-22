<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Auth;
use App\Models\User;

$user = User::find(3);
Auth::setUser($user);

echo "=== Testing File Serving (Excel) ===\n";

$controller = new \App\Http\Controllers\User\MaterialController();

// Test material 73 (MP4 video)
echo "\n1. MP4 Video (Material 73):\n";
$response = $controller->serveFile(71, 73);
if ($response instanceof \Symfony\Component\HttpFoundation\BinaryFileResponse) {
    echo "   Content-Type: " . $response->headers->get('Content-Type') . "\n";
    echo "   Content-Disposition: " . $response->headers->get('Content-Disposition') . "\n";
}

// Test material 72 (XLSX Excel)
echo "\n2. XLSX Excel (Material 72):\n";
$response = $controller->serveFile(71, 72);
if ($response instanceof \Symfony\Component\HttpFoundation\BinaryFileResponse) {
    echo "   Content-Type: " . $response->headers->get('Content-Type') . "\n";
    echo "   Content-Disposition: " . $response->headers->get('Content-Disposition') . "\n";
}
