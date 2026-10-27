<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    private function rules(?int $ignoreId = null): array
    {
        $password = Password::min(8)->letters()->numbers();

        return [
            'name' => 'required|string|min:2|max:80',
            'email' => 'required|email|max:120|unique:users,email' . ($ignoreId ? ',' . $ignoreId : ''),
            'phone' => ['nullable', 'string', 'max:30', 'regex:/^[0-9+\-\s()]*$/'],
            'job_title' => 'nullable|string|max:80',
            'role' => ['required', Rule::in(array_keys(config('roles.roles')))],
            'active' => 'sometimes|boolean',
            'password' => $ignoreId ? ['nullable', $password] : ['required', $password],
        ];
    }

    private function messages(): array
    {
        return [
            'name.required' => 'Enter the name.',
            'email.required' => 'Enter the email.',
            'email.email' => 'Enter a valid email address.',
            'email.unique' => 'This email is already used by another user.',
            'phone.regex' => 'Phone can only have numbers, +, - and spaces.',
            'role.required' => 'Choose a role.',
            'password.required' => 'Set a password for this user.',
        ];
    }

    // Aakhri active owner ko hatane ya band karne se rokna
    private function protectOwner(Request $request, User $user, string $newRole, bool $newActive): ?string
    {
        if ($user->id === $request->user()->id && ($newRole !== $user->role || !$newActive)) {
            return 'You cannot change your own role or deactivate yourself.';
        }

        if ($user->isOwner() && ($newRole !== 'owner' || !$newActive)) {
            $others = User::where('role', 'owner')->where('active', true)->where('id', '!=', $user->id)->exists();
            if (!$others) {
                return 'There must be at least one active owner.';
            }
        }

        return null;
    }

    public function index(Request $request)
    {
        $users = User::orderBy('name')->get()->map(function ($u) use ($request) {
            return [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'phone' => $u->phone ?? '',
                'job_title' => $u->job_title ?? '',
                'role' => $u->role,
                'role_label' => $u->roleLabel(),
                'active' => $u->active,
                'last_login' => $u->last_login_at ? $u->last_login_at->toIso8601String() : null,
                'me' => $u->id === $request->user()->id,
            ];
        });

        $roles = collect(config('roles.roles'))->map(function ($r, $key) {
            return ['key' => $key, 'label' => $r['label'], 'about' => $r['about']];
        })->values();

        return response()->json(['users' => $users, 'roles' => $roles]);
    }

    public function store(Request $request)
    {
        $data = $request->validate($this->rules(), $this->messages());
        $data['active'] = $data['active'] ?? true;

        $user = User::create($data);

        return response()->json(['id' => $user->id]);
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate($this->rules($user->id), $this->messages());
        $active = array_key_exists('active', $data) ? (bool) $data['active'] : $user->active;

        $problem = $this->protectOwner($request, $user, $data['role'], $active);
        if ($problem) {
            return response()->json(['message' => $problem], 422);
        }

        if (empty($data['password'])) {
            unset($data['password']);
        } else {
            AuditLog::record('password_reset', $user, 'Password was reset for ' . $user->name);
        }

        $user->update($data);

        return response()->json(['ok' => true]);
    }

    public function status(Request $request, User $user)
    {
        $data = $request->validate(['active' => 'required|boolean']);

        $problem = $this->protectOwner($request, $user, $user->role, (bool) $data['active']);
        if ($problem) {
            return response()->json(['message' => $problem], 422);
        }

        $user->update(['active' => $data['active']]);

        return response()->json(['ok' => true]);
    }

    // Apna password badalna (har user ke liye)
    public function changePassword(Request $request)
    {
        $data = $request->validate([
            'current_password' => 'required|current_password',
            'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()],
        ], [
            'current_password.required' => 'Enter your current password.',
            'current_password.current_password' => 'Your current password is wrong.',
            'password.required' => 'Enter the new password.',
            'password.confirmed' => 'The two new passwords do not match.',
        ]);

        $request->user()->update(['password' => $data['password']]);
        AuditLog::record('password_changed', $request->user(), $request->user()->name . ' changed own password');

        return response()->json(['ok' => true]);
    }
}