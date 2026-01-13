<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Http\Controllers\User\QuizController;

// Login as test user
$user = User::where('role', 'user')->first();
if (!$user) {
    echo "No user found\n"; exit(1);
}
Auth::loginUsingId($user->id);

$controller = new QuizController();
$response = $controller->show(5, 'pretest');

// The controller returns a JsonResponse
echo "--- show() JSON ---\n";
echo json_encode($response->getData(), JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE) . "\n";

// Call take() which renders Inertia page; it returns an Inertia\Response object
$inertia = $controller->take(5, 'pretest');
if ($inertia instanceof \Inertia\Response) {
    echo "--- take() props ---\n";
    // The props are stored in ->getData()['props']
    $page = $inertia->toArray();
    echo json_encode($page, JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE) . "\n";
} else {
    echo "take() did not return an Inertia Response, type: " . gettype($inertia) . "\n";
}