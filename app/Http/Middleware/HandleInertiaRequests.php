<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use Closure;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Skip Inertia processing for export routes.
     */
    public function handle(Request $request, Closure $next)
    {
        // ⚠️ CRITICAL FIX: Export routes MUST NOT be processed by Inertia
        // Skip parent::handle() completely for export routes
        if ($request->is('admin/reports/export-*') || $request->is('api/admin/reporting/export-*')) {
            // Call next middleware in the chain (skip Inertia processing entirely)
            // This allows the response to be sent without Inertia wrapping
            return $next($request);
        }

        // For all other requests, use normal Inertia handling with parent
        return parent::handle($request, $next);
    }

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
        ];
    }
}
