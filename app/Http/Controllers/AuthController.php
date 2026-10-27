<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function showLogin()
    {
        // Software pehli baar khula hai to pehle owner ka account banao
        if (User::count() === 0) {
            return redirect('/setup');
        }

        return view('auth.login');
    }

    public function login(Request $request)
    {
        $cred = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ], [
            'email.required' => 'Enter your email.',
            'email.email' => 'Enter a valid email address.',
            'password.required' => 'Enter your password.',
        ]);

        $ok = Auth::attempt([
            'email' => $cred['email'],
            'password' => $cred['password'],
            'active' => true,
        ], $request->boolean('remember'));

        if (!$ok) {
            return back()
                ->withErrors(['email' => 'Wrong email or password, or this account is inactive.'])
                ->onlyInput('email');
        }

        $request->session()->regenerate();

        $user = $request->user();
        $user->forceFill(['last_login_at' => now()])->saveQuietly();
        AuditLog::record('login', $user, $user->name . ' logged in');

        return redirect()->intended('/');
    }

    public function logout(Request $request)
    {
        if ($request->user()) {
            AuditLog::record('logout', $request->user(), $request->user()->name . ' logged out');
        }

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login');
    }

    public function showSetup()
    {
        if (User::count() > 0) {
            return redirect('/login');
        }

        return view('auth.setup');
    }

    public function setup(Request $request)
    {
        if (User::count() > 0) {
            return redirect('/login');
        }

        $data = $request->validate([
            'name' => 'required|string|min:2|max:80',
            'email' => 'required|email|max:120|unique:users,email',
            'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()],
        ], [
            'name.required' => 'Enter your name.',
            'email.required' => 'Enter your email.',
            'email.email' => 'Enter a valid email address.',
            'email.unique' => 'This email is already used.',
            'password.required' => 'Choose a password.',
            'password.confirmed' => 'The two passwords do not match.',
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => 'owner',
            'active' => true,
        ]);

        Auth::login($user);
        $request->session()->regenerate();

        return redirect('/');
    }
}