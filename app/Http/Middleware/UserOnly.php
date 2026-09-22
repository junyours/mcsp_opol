<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class UserOnly
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (! $user || strtolower($user->role ?? '') !== 'user') {
            abort(403, 'Unauthorized access. User only.');
        }

        return $next($request);
    }
}
