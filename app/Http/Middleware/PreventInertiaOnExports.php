<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PreventInertiaOnExports
{
    public function handle(Request $request, Closure $next): Response
    {
        // Bypass Inertia for export routes
        if ($request->is('admin/reports/export-*')) {
            // Set a flag to tell Inertia not to process this response
            $request->attributes->set('skip_inertia', true);
        }

        return $next($request);
    }
}
