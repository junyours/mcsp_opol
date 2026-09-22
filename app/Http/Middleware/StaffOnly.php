<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class StaffOnly
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user() || strtolower($request->user()->role ?? '') !== 'staff') {
            abort(403, 'Unauthorized access. Staff only.');
        }

        return $next($request);
    }
}