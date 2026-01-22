<?php

use Illuminate\Support\Str;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use function Pest\Laravel\actingAs;
use function Pest\Laravel\post;
use function Pest\Laravel\getJson;

// Uses binding inherited from tests/Pest.php (Feature directory) - no local uses() needed.

it('admin can create program with question image and quiz returns image url', function () {
    // Fake public disk
    Storage::fake('public');

    // Create admin and regular user
    $admin = \App\Models\User::factory()->create(['role' => 'admin']);
    $user = \App\Models\User::factory()->create(['role' => 'user']);

    // Prepare payload with pre_test_questions including an uploaded image
    $image = UploadedFile::fake()->image('question1.jpg');

    $payload = [
        'title' => 'Image Quiz Program',
        'description' => 'Testing image in question',
        'duration_minutes' => 30,
        'is_draft' => 1, // allow draft to relax validation
        'pre_test_questions' => [
            [
                'question_text' => 'Test question with image',
                'option_a' => 'A',
                'option_b' => 'B',
                'option_c' => 'C',
                'option_d' => 'D',
                'correct_answer' => 'a',
                'image_url' => $image,
            ]
        ]
    ];

    $response = actingAs($admin)->post('/api/admin/training-programs', $payload);
    if ($response->status() !== 201) {
        fwrite(STDOUT, "Response: " . $response->getContent() . "\n");
    }
    $response->assertStatus(201);

    $moduleId = $response->json('data.id') ?? $response->json('program.id');
    expect($moduleId)->not->toBeNull();

    // Question created
    expect(DB::table('questions')->where('module_id', $moduleId)->where('question_text', 'Test question with image')->exists())->toBeTrue();

    $question = \App\Models\Question::where('module_id', $moduleId)->first();
    expect($question->image_url)->not->toBeNull();
    expect($question->image_url)->toContain('/storage/questions/');

    // Now call the quiz show API as a regular user
    // Assign user to training so they can access it
    DB::table('user_trainings')->insert([
        'user_id' => $user->id,
        'module_id' => $moduleId,
        'status' => 'enrolled',
        'enrolled_at' => now(),
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $res = actingAs($user)->getJson("/api/training/{$moduleId}/quiz/pretest");
    $res->assertStatus(200);
    $res->assertJsonFragment(['question_text' => 'Test question with image']);

    $questions = $res->json('questions');
    expect($questions)->not->toBeEmpty();
    expect(array_key_exists('image_url', $questions[0]))->toBeTrue();

    $imageUrl = $questions[0]['image_url'];
    expect(is_string($imageUrl))->toBeTrue();

    // The image_url should point to a storage URL (either starting with /storage or full URL)
    expect(str_starts_with($imageUrl, '/storage') || filter_var($imageUrl, FILTER_VALIDATE_URL))->toBeTrue();
});