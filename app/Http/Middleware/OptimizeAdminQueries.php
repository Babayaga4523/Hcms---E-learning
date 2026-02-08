<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Cache;

class OptimizeAdminQueries
{
    /**
     * Handle an incoming request.
     * Optimize slow admin queries dengan caching
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Jangan cache jika ada force refresh
        if ($request->query('refresh') === 'true') {
            Cache::forget('admin_dashboard_stats');
            Cache::forget('admin_analytics_data');
        }

        // Set response cache headers untuk API
        $response = $next($request);

        if ($request->is('api/admin/*')) {
            // Cache API responses untuk 5 menit
            $response->header('Cache-Control', 'public, max-age=300');
            $response->header('ETag', md5($response->getContent()));
        }

        return $response;
    }
}
