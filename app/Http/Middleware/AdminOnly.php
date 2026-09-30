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
        $user = $request->user();

        if (! $user) {
            abort(403, 'Unauthorized access. Admin only.');
        }

        $role = strtolower(trim($user->role ?? ''));

        if ($role !== 'admin') {
            $destination = match ($role) {
                'staff' => 'staff.dashboard',
                'treasury' => 'treasury.statement-accounts',
                'user', 'resident' => 'residents.dashboard',
                default => null,
            };

            if ($destination) {
                return redirect()->route($destination);
            }

            abort(403, 'Unauthorized access. Admin only.');
        }

        return $next($request);
    }
}
