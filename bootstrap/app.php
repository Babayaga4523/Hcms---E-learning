<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Session\TokenMismatchException;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        // Exclude logout from CSRF verification
        $middleware->validateCsrfTokens(except: [
            'logout',
        ]);

        // Register alias middleware
        $middleware->alias([
            'admin' => \App\Http\Middleware\IsAdmin::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Handle CSRF Token Mismatch (419 Page Expired)
        $exceptions->render(function (TokenMismatchException $e, Request $request) {
            // Jika error token terjadi saat user ingin Logout, anggap sukses dan redirect ke login
            if ($request->is('logout') || $request->routeIs('logout')) {
                return redirect('/login')->with('status', 'Sesi Anda telah berakhir.');
            }

            // Untuk Inertia request, redirect dengan pesan
            if ($request->header('X-Inertia')) {
                return redirect()->back()->withErrors(['csrf' => 'Sesi telah berakhir. Silakan coba lagi.']);
            }

            // Untuk request biasa, kembalikan ke halaman sebelumnya
            return redirect()->back()->withInput()->withErrors(['csrf' => 'Halaman telah kadaluarsa. Silakan coba lagi.']);
        });
    })->create();
