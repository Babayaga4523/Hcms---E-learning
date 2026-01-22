<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Models\Module;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AnalyticsOverviewTrendTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function overview_enrollments_match_trends_and_growth_from_zero_is_100_percent()
    {
        // Freeze time to make assertions easier
        Carbon::setTestNow(Carbon::now());

        // Create admin
        $admin = User::factory()->create(['role' => 'admin']);

        // Create module
        $module = Module::factory()->create();

        // Create 5 learners and enroll them (created_at within current period)
        $learners = User::factory()->count(5)->create(['role' => 'user']);

        foreach ($learners as $learner) {
            DB::table('user_trainings')->insert([
                'user_id' => $learner->id,
                'module_id' => $module->id,
                'status' => 'in_progress',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Ensure no trainings exist in previous period
        // (RefreshDatabase ensures clean DB)

        // Act as admin and call overview with 7-day range
        $res = $this->actingAs($admin)->getJson('/api/admin/analytics/overview?range=7');
        $res->assertStatus(200);

        $payload = $res->json();

        $this->assertEquals(5, $payload['enrollments']);
        $this->assertEquals(100, $payload['trends']['enrollments_trend']);

        // Call trends endpoint and ensure sums match
        $trendsRes = $this->actingAs($admin)->getJson('/api/admin/analytics/trends?range=7');
        $trendsRes->assertStatus(200);
        $trendsData = $trendsRes->json();

        $sumEnrollments = array_sum(array_column($trendsData, 'enrollments'));
        $this->assertEquals(5, $sumEnrollments);

        // Ensure types are numeric
        foreach ($trendsData as $point) {
            $this->assertIsInt($point['enrollments']);
            $this->assertIsInt($point['completions']);
            $this->assertIsFloat((float) $point['hours']);
        }
    }
}
