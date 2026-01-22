<?php

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use function Pest\Laravel\get;
use function Pest\Laravel\post;
use function Pest\Laravel\actingAs;

test('login screen can be rendered', function () {
    $response = get('/login');

    $response->assertStatus(200);
});

test('users can authenticate using the login screen', function () {
    $user = User::factory()->create();

    $response = post('/login', [
        'email' => $user->email,
        'password' => 'password',
    ]);

    expect(Auth::check())->toBeTrue();
    $response->assertRedirect(route('dashboard', absolute: false));
});

test('users can not authenticate with invalid password', function () {
    $user = User::factory()->create();

    post('/login', [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);

    expect(Auth::check())->toBeFalse();
});

test('users can logout', function () {
    $user = User::factory()->create();

    $response = actingAs($user)->post('/logout');

    expect(Auth::check())->toBeFalse();
    $response->assertRedirect('/login');
});
