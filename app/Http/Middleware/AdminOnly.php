<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminOnly
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user() || strtolower($request->user()->role ?? '') !== 'admin') {
            abort(403, 'Unauthorized access. Admin only.');
        }

        return $next($request);
    }
}
