<?php

use Tests\TestCase;


it('returns a successful response', function () {
    /** @var \Tests\TestCase $this */
    $response = $this->get('/');

    $response->assertStatus(200);
});
