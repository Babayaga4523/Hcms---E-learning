<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Http\Controllers\Admin\AnalyticsController;

class AnalyticsControllerHelperTest extends TestCase
{
    /** @test */
    public function parse_range_accepts_strings_and_returns_valid_integer()
    {
        $controller = new AnalyticsController();

        $ref = new \ReflectionMethod(AnalyticsController::class, 'parseRange');
        // Use getClosure to avoid deprecated Reflection::setAccessible
        $closure = $ref->getClosure($controller);

        $this->assertEquals(7, $closure('7D'));
        $this->assertEquals(30, $closure('30D'));
        $this->assertEquals(90, $closure('90D'));
        $this->assertEquals(365, $closure('365D'));

        // invalid values fall back to 30
        $this->assertEquals(30, $closure('xyz'));
        $this->assertEquals(30, $closure('0'));
        $this->assertEquals(30, $closure(null));

        // numeric input is accepted
        $this->assertEquals(7, $closure(7));
    }
}
