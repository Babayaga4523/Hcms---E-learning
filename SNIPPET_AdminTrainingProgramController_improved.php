<?php
/**
 * SNIPPET: AdminTrainingProgramController - Improved Image Handling
 * 
 * Location: app/Http/Controllers/AdminTrainingProgramController.php
 * Around line: 600-720 (dalam store method, questions processing section)
 * 
 * REPLACE the image handling code dengan ini:
 */

// ========== CODE TO REPLACE IN AdminTrainingProgramController.php ==========

// Tambahkan di bagian atas file (import):
use App\Services\ImageUploadHandler;

// DALAM METHOD store(), dalam loop questions processing:
// Cari bagian: "// Build question data" atau "if (isset($qData['image_url']))"
// GANTI dengan code ini:

// Initialize image handler
$imageHandler = new ImageUploadHandler();
$imageUrl = null;

// Handle image upload from various sources
if (isset($qData['image_url']) && !empty($qData['image_url'])) {
    // Check if it's an uploaded file object
    if ($qData['image_url'] instanceof UploadedFile) {
        // Handle file upload
        $imageUrl = $imageHandler->handle($qData['image_url'], [
            'module_id' => $module->id,
            'question_index' => $index,
            'source' => 'direct_upload'
        ]);
        
        if ($imageUrl) {
            Log::info('Question image uploaded successfully', [
                'question_index' => $index,
                'filename' => basename($imageUrl),
                'url' => $imageUrl
            ]);
        } else {
            Log::warning('Question image upload failed', [
                'question_index' => $index,
                'filename' => $qData['image_url']->getClientOriginalName() ?? 'unknown'
            ]);
        }
    } else if (is_string($qData['image_url'])) {
        // Handle string input (base64, URL, or path)
        $imageUrl = $imageHandler->handle($qData['image_url'], [
            'module_id' => $module->id,
            'question_index' => $index,
            'source' => 'string_input'
        ]);
        
        if ($imageUrl) {
            Log::info('Question image processed successfully', [
                'question_index' => $index,
                'url' => $imageUrl,
                'type' => str_starts_with($qData['image_url'], 'data:') ? 'base64' : 'reference'
            ]);
        } else {
            Log::warning('Question image processing failed', [
                'question_index' => $index,
                'input_type' => gettype($qData['image_url']),
                'input_preview' => substr($qData['image_url'], 0, 100)
            ]);
        }
    } else {
        Log::warning('Unexpected image_url type', [
            'question_index' => $index,
            'type' => gettype($qData['image_url'])
        ]);
    }
}

// Build question data with validated image URL
$questionData = [
    'module_id' => $module->id,
    'quiz_id' => $quiz->id,
    'question_text' => $qData['question_text'],
    'question_type' => $qType,
    'options' => $normalizedOptions,
    'correct_answer' => $qData['correct_answer'] ?? null,
    'explanation' => $qData['explanation'] ?? null,
    'image_url' => $imageUrl,  // Only validated URLs are stored
    'order' => $index + 1,
    'difficulty' => $qData['difficulty'] ?? 'medium',
];

// ... rest of the code remains the same

?>
