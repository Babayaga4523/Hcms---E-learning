<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;
use Illuminate\Support\Facades\Log;

class VerifyCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array<int, string>
     */
    protected $except = [
        'logout',
        'api/*',
    ];

    /**
     * Determine if the session and input CSRF tokens match.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return bool
     */
    protected function tokensMatch($request)
    {
        $token = $this->getTokenFromRequest($request);

        $sessionToken = is_string($request->session()->token()) ? $request->session()->token() : null;

        $match = is_string($sessionToken) && is_string($token) && hash_equals($sessionToken, $token);

        if (!$match) {
            // In local or debug mode, log masked tokens to help diagnose stale CSRF tokens
            if (app()->environment('local') || config('app.debug')) {
                $mask = function ($t) {
                    if (!is_string($t)) return 'null';
                    if (strlen($t) <= 10) return $t;
                    return substr($t, 0, 6) . '...' . substr($t, -4);
                };

                Log::warning('CSRF token mismatch for URI: ' . $request->getRequestUri(), [
                    'session_token' => $mask($sessionToken),
                    'request_token' => $mask($token),
                    'method' => $request->getMethod(),
                ]);
            } else {
                Log::warning('CSRF token mismatch for URI: ' . $request->getRequestUri(), [
                    'method' => $request->getMethod(),
                ]);
            }
        }

        return $match;
    }
}