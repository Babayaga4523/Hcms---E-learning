<?php

use Illuminate\Support\Str;
use function Pest\Laravel\get;

// Uses binding inherited from tests/Pest.php (Feature directory) - no local uses() needed.

// Serve an existing question image from storage/app/public/questions
it('serves an existing question image', function () {
    $filename = 'questions/' . Str::random(8) . '.png';
    $fullPath = storage_path('app/public/' . $filename);

    if (! file_exists(dirname($fullPath))) {
        mkdir(dirname($fullPath), 0755, true);
    }

    // Write a small valid 1x1 PNG so MIME type is recognized
    file_put_contents($fullPath, base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAoMBgV8Z7dMAAAAASUVORK5CYII='));

    $url = '/storage/' . $filename;

    $response = get($url);

    $response->assertStatus(200);
    // Some environments may detect mime-type differently for synthetic data; assert that it's an image type
    $this->assertStringContainsString('image', $response->headers->get('Content-Type'));

    // Cleanup
    @unlink($fullPath);
    @rmdir(dirname($fullPath));
});

it('returns 404 for a missing question image', function () {
    $filename = 'questions/not-exists-' . Str::random(6) . '.png';
    $url = '/storage/' . $filename;

    $response = get($url);

    $response->assertStatus(404);
});
