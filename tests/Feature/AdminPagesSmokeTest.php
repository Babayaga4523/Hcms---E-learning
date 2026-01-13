<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;

class AdminPagesSmokeTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_pages_return_success_when_authenticated()
    {
        // Find or create admin user
        $admin = User::where('role', 'admin')->first() ?? User::factory()->create(['role' => 'admin']);

        $routes = Route::getRoutes();
        $errors = [];

        foreach ($routes as $route) {
            $uri = $route->uri();
            if (!str_starts_with($uri, 'admin/') || str_starts_with($uri, 'api/admin/')) continue;

            $methods = $route->methods();
            if (!in_array('GET', $methods)) continue;

            // Normalize route URL (replace parameters with 1)
            $url = '/' . preg_replace('/\{[^}]+\}/', '1', $uri);

            $response = $this->actingAs($admin)->get($url);

            $status = $response->getStatusCode();
            // Accept 200 (OK) and 404 (resource not found) as valid responses for pages
            if (!in_array($status, [200, 404])) {
                $errors[] = [$url, $status];
            }
        }



        if (!empty($errors)) {
            $message = "Some admin pages failed: \n";
            foreach ($errors as [$url, $status]) {
                $message .= " - {$url} returned {$status}\n";
            }
            $this->fail($message);
        }

        $this->assertTrue(true);
    }
}
