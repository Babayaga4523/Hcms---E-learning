<?php

use Tests\TestCase;

uses(TestCase::class);

it('returns a successful response', function () {
    /** @var \Tests\TestCase $this */
    $response = $this->get('/');

    $response->assertStatus(200);
});
