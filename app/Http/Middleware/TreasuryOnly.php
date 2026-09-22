<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TreasuryOnly
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user() || strtolower($request->user()->role ?? '') !== 'treasury') {
            abort(403);
        }

        return $next($request);
    }
}