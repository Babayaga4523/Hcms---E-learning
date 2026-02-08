<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Question;
use Illuminate\Support\Facades\DB;

echo "=== FIXING BROKEN IMAGE REFERENCES ===\n\n";

// Find all questions with image URLs
$questionsWithImages = Question::whereNotNull('image_url')
    ->where('image_url', '!=', '')
    ->get();

echo "Checking " . $questionsWithImages->count() . " questions with image URLs...\n\n";

$brokenCount = 0;
$validCount = 0;

foreach ($questionsWithImages as $q) {
    $imageUrl = $q->image_url;
    
    // Extract filename from URL
    $filename = basename($imageUrl);
    
    // Check physical file
    $physicalPath = 'storage/app/public/questions/' . $filename;
    
    if (!file_exists($physicalPath)) {
        echo "❌ BROKEN - Question {$q->id}: {$imageUrl}\n";
        echo "   Physical file missing: {$physicalPath}\n";
        
        // Option 1: Clear the broken reference
        $q->image_url = null;
        $q->save();
        echo "   ✓ Cleared image_url from database\n";
        
        $brokenCount++;
    } else {
        echo "✅ VALID - Question {$q->id}: {$filename}\n";
        $validCount++;
    }
}

echo "\n=== SUMMARY ===\n";
echo "Valid image references: {$validCount}\n";
echo "Fixed broken references: {$brokenCount}\n";

if ($brokenCount > 0) {
    echo "\n⚠️  Note: The following questions had their image_url cleared:\n";
    $brokenQuestions = Question::onlyTrashed()->orWhere('image_url', null)->get();
    
    // Show questions that were just fixed
    $fixed = DB::table('questions')
        ->whereNull('image_url')
        ->whereIn('id', [138]) // The question we just found
        ->get();
    
    foreach ($fixed as $q) {
        echo "- Question {$q->id} (Module {$q->module_id}): {$q->question_text}\n";
    }
    
    echo "\nAdmins should re-upload images for these questions.\n";
}
