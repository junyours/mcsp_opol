<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class StaffController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/CreateStaff', [
            'staff' => User::query()
                ->whereIn('role', ['Staff', 'staff', 'Treasury', 'treasury'])
                ->with('profilePicture:id,user_id,image_path')
                ->latest()
                ->get(['id', 'name', 'email', 'role', 'status', 'created_at']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
			'role' => ['required', 'in:Staff,Treasury'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'status' => ['required', 'in:active,inactive'],
        ]);

        User::create([
            ...$validated,
        ]);

        return back()->with('success', 'Staff account created successfully.');
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        abort_unless(in_array($user->role, ['Staff', 'staff', 'Treasury', 'treasury'], true), 404);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email,' . $user->id],
			'role' => ['required', 'in:Staff,Treasury'],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
            'status' => ['required', 'in:active,inactive'],
        ]);

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
			'role' => $validated['role'],
            'status' => $validated['status'],
            ...(!empty($validated['password']) ? ['password' => Hash::make($validated['password'])] : []),
        ]);

        return back()->with('success', 'Staff account updated successfully.');
    }
}
