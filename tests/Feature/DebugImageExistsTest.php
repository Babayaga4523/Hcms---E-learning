<?php

use Illuminate\Support\Facades\Storage;
use App\Models\User;
use function Pest\Laravel\actingAs;
use function Pest\Laravel\get;

// Uses binding inherited from tests/Pest.php (Feature directory) - no local uses() needed.

it('checkImageExists returns correct metadata for existing file', function () {
    Storage::fake('public');

    // create admin
    $admin = User::factory()->create(['role' => 'admin']);

    // put fake file
    Storage::disk('public')->put('questions/debug-test.png', 'dummy');

    $res = actingAs($admin)->get('/api/admin/debug/image-exists?path=questions/debug-test.png');
    $res->assertStatus(200);
    $res->assertJsonFragment(['exists' => true, 'path' => 'questions/debug-test.png']);
    $json = $res->json();
    expect($json['url'])->not->toBeNull();
});

it('checkImageExists returns false for missing file', function () {
    Storage::fake('public');
    $admin = User::factory()->create(['role' => 'admin']);

    $res = actingAs($admin)->get('/api/admin/debug/image-exists?path=questions/missing.png');
    $res->assertStatus(200);
    $res->assertJsonFragment(['exists' => false]);
});