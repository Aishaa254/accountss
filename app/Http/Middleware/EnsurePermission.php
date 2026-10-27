<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsurePermission
{
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();

        // Account band kar diya gaya ho to usi waqt bahar
        if ($user && !$user->active) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            if ($request->expectsJson()) {
                return response()->json(['message' => 'This account is inactive.'], 401);
            }

            return redirect('/login')->withErrors(['email' => 'This account is inactive.']);
        }

        if (!$user || !$user->hasPermission($permission)) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'You do not have access to this.'], 403);
            }

            abort(403, 'You do not have access to this page.');
        }

        return $next($request);
    }
}