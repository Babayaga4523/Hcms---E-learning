/*
 * SNIPPET: QuestionController - Improved Image Handling
 * 
 * Location: app/Http/Controllers/Quiz/QuestionController.php
 * 
 * PASTE the store() and update() methods dari code ini ke dalam QuestionController class
 * 
 * NOTE: File ini adalah reference dokumentasi, bukan PHP executable
 */

// ========== IMPORT (di bagian atas file) ==========
use App\Services\ImageUploadHandler;

// ========== STORE METHOD ==========
/*
public function store(StoreQuestionRequest $request): JsonResponse
{
    try {
        $validated = $request->validated();
        
        $imageHandler = new ImageUploadHandler();
        
        // Handle image upload with validation
        if ($request->hasFile('image_url')) {
            // File upload via form
            $imageUrl = $imageHandler->handle(
                $request->file('image_url'),
                [
                    'module_id' => $validated['module_id'] ?? null,
                    'source' => 'form_upload'
                ]
            );
            
            if ($imageUrl) {
                $validated['image_url'] = $imageUrl;
                Log::info('Image uploaded via form', [
                    'question_id' => $validated['id'] ?? 'new',
                    'url' => $imageUrl
                ]);
            } else {
                Log::warning('Image upload failed', [
                    'question_id' => $validated['id'] ?? 'new',
                    'file' => $request->file('image_url')->getClientOriginalName()
                ]);
                // Continue without image rather than error
                $validated['image_url'] = null;
            }
        } else if (isset($validated['image_url']) && !empty($validated['image_url'])) {
            // String input (base64, URL, or path reference)
            $imageUrl = $imageHandler->handle(
                $validated['image_url'],
                [
                    'module_id' => $validated['module_id'] ?? null,
                    'source' => 'string_input'
                ]
            );
            
            if ($imageUrl) {
                $validated['image_url'] = $imageUrl;
            } else {
                // Invalid or missing file
                Log::warning('Invalid image reference removed', [
                    'question_id' => $validated['id'] ?? 'new',
                    'provided_value' => substr($validated['image_url'], 0, 100)
                ]);
                $validated['image_url'] = null;
            }
        }

        // Auto-assign points based on difficulty if not provided
        if (empty($validated['points'])) {
            $difficultyPoints = [
                'easy' => 3,
                'medium' => 5,
                'hard' => 7,
            ];
            $validated['points'] = $difficultyPoints[$validated['difficulty']] ?? 5;
        }

        // Get next order number
        $maxOrder = Question::where('quiz_id', $validated['quiz_id'])
            ->max('order');
        $validated['order'] = ($maxOrder ?? 0) + 1;

        $question = Question::create($validated);

        Log::info('Question created', [
            'question_id' => $question->id,
            'has_image' => !empty($question->image_url),
            'type' => $validated['question_type'] ?? 'unknown'
        ]);

        return response()->json($question, 201);
        
    } catch (\Exception $e) {
        Log::error('Failed to create question', [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
        
        return response()->json([
            'error' => 'Failed to create question',
            'message' => $e->getMessage(),
        ], 500);
    }
}
*/

// ========== UPDATE METHOD ==========
/*
public function update(UpdateQuestionRequest $request, Question $question): JsonResponse
{
    try {
        $validated = $request->validated();
        
        $imageHandler = new ImageUploadHandler();
        
        // Handle image upload/update
        if ($request->hasFile('image_url')) {
            // Delete old image if exists
            if ($question->image_url) {
                $imageHandler->delete($question->image_url);
                Log::info('Old image deleted', ['url' => $question->image_url]);
            }
            
            // Upload new image
            $imageUrl = $imageHandler->handle(
                $request->file('image_url'),
                [
                    'module_id' => $question->module_id,
                    'question_id' => $question->id,
                    'source' => 'form_update'
                ]
            );
            
            if ($imageUrl) {
                $validated['image_url'] = $imageUrl;
                Log::info('Image updated via form', [
                    'question_id' => $question->id,
                    'url' => $imageUrl
                ]);
            } else {
                Log::warning('Image update failed', [
                    'question_id' => $question->id,
                    'file' => $request->file('image_url')->getClientOriginalName()
                ]);
                // Clear image if upload fails
                $validated['image_url'] = null;
            }
        } else if (isset($validated['image_url'])) {
            // Check if image_url field is being updated
            if (empty($validated['image_url'])) {
                // Explicitly clear image (delete file)
                if ($question->image_url) {
                    $imageHandler->delete($question->image_url);
                    Log::info('Image cleared by user', ['question_id' => $question->id]);
                }
                $validated['image_url'] = null;
            } else {
                // Validate the provided image reference
                $imageUrl = $imageHandler->handle(
                    $validated['image_url'],
                    [
                        'module_id' => $question->module_id,
                        'question_id' => $question->id,
                        'source' => 'string_update'
                    ]
                );
                
                if ($imageUrl) {
                    $validated['image_url'] = $imageUrl;
                } else {
                    Log::warning('Invalid image reference in update', [
                        'question_id' => $question->id,
                        'provided_value' => substr($validated['image_url'], 0, 100)
                    ]);
                    // Keep old image if new one is invalid
                    unset($validated['image_url']);
                }
            }
        }

        // Update question
        $question->update($validated);

        Log::info('Question updated', [
            'question_id' => $question->id,
            'has_image' => !empty($question->image_url)
        ]);

        return response()->json($question, 200);
        
    } catch (\Exception $e) {
        Log::error('Failed to update question', [
            'question_id' => $question->id,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
        
        return response()->json([
            'error' => 'Failed to update question',
            'message' => $e->getMessage(),
        ], 500);
    }
}
*/
