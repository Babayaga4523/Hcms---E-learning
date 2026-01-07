<?php
require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Module;
use App\Models\UserTraining;

echo "=== Testing My Trainings API Data ===\n\n";

// Get a user with enrollments
$userWithEnrollments = User::whereHas('trainings')->first();

if (!$userWithEnrollments) {
    echo "❌ No user with trainings found!\n";
    exit(1);
}

echo "👤 Testing with user: {$userWithEnrollments->name} (ID: {$userWithEnrollments->id})\n\n";

// Simulate what the API returns
$trainings = Module::query()
    ->select([
        'modules.*',
        'user_trainings.status as enrollment_status',
        'user_trainings.enrolled_at',
        'user_trainings.completed_at',
        'user_trainings.final_score as progress'
    ])
    ->join('user_trainings', 'modules.id', '=', 'user_trainings.module_id')
    ->where('user_trainings.user_id', $userWithEnrollments->id)
    ->get();

echo "📚 Found {$trainings->count()} training(s):\n\n";

foreach ($trainings as $t) {
    // Count virtual materials
    $materialsCount = 0;
    if ($t->video_url) $materialsCount++;
    if ($t->document_url) $materialsCount++;
    if ($t->presentation_url) $materialsCount++;
    if ($materialsCount === 0) $materialsCount = 1;
    
    echo "   📖 {$t->title}\n";
    echo "      - ID: {$t->id}\n";
    echo "      - Duration: {$t->duration_minutes} minutes\n";
    echo "      - Materials Count: {$materialsCount}\n";
    echo "      - Category: {$t->category}\n";
    echo "      - Status: {$t->enrollment_status}\n";
    echo "      - Progress: {$t->progress}%\n";
    echo "      - Video URL: " . ($t->video_url ? 'Yes' : 'No') . "\n";
    echo "      - Document URL: " . ($t->document_url ? 'Yes' : 'No') . "\n";
    echo "      - Presentation URL: " . ($t->presentation_url ? 'Yes' : 'No') . "\n";
    echo "\n";
}

echo "✅ API data check complete!\n";
echo "\n💡 Access: http://localhost:8000/my-trainings\n";
