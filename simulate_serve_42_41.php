<?php
require_once 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Auth;

$ut = \App\Models\UserTraining::where('module_id', 42)->first();
if (!$ut) { echo "No user_training found for module 42\n"; exit(1); }

$user = \App\Models\User::find($ut->user_id);
Auth::login($user);

$ctrl = new \App\Http\Controllers\User\MaterialController();
$resp = $ctrl->serveFile(42, 41);

if (method_exists($resp, 'getStatusCode')) {
    echo "Response status: " . $resp->getStatusCode() . "\n";
}

if ($resp instanceof \Illuminate\Http\JsonResponse) {
    echo "JSON: \n";
    print_r($resp->getData(true));
} else {
    echo "Response class: " . get_class($resp) . "\n";
    if (method_exists($resp, 'getFile')) {
        try {
            $file = $resp->getFile();
            echo "Serving file: " . (string)$file . "\n";
        } catch (Exception $e) {
            echo "Cannot retrieve file from response: " . $e->getMessage() . "\n";
        }
    }
}
?>