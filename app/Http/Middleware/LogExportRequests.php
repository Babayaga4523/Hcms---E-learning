<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class LogExportRequests
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->path() === 'admin/reports/export-excel') {
            \Log::info('LogExportRequests: Export route matched!', [
                'method' => $request->method(),
                'path' => $request->path(),
                'url' => $request->url(),
            ]);
        }
        return $next($request);
    }
}
