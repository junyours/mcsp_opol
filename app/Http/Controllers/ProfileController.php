<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        $profilePicture = $request->user()->profilePicture;

        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
            'profilePicture' => $profilePicture?->image_path ? Storage::disk('public')->url($profilePicture->image_path) : null,
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();
        $profilePicture = $request->file('profile_picture');

        $validated['name'] = $validated['name'] ?? $user->name;
        $validated['email'] = $validated['email'] ?? $user->email;

        Log::info('Profile update started', [
            'user_id' => $user?->id,
            'name' => $validated['name'] ?? null,
            'email' => $validated['email'] ?? null,
            'has_profile_picture' => (bool) $profilePicture,
            'profile_picture_name' => $profilePicture?->getClientOriginalName(),
            'profile_picture_size' => $profilePicture?->getSize(),
            'profile_picture_mime' => $profilePicture?->getMimeType(),
        ]);

        unset($validated['profile_picture']);
        $user->fill($validated);

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        if ($profilePicture) {
            $existing = $user->profilePicture;
            $path = $profilePicture->storeAs('profiles/' . $user->id, 'profile-' . Str::slug($user->name, '-') . '-' . time() . '.' . $profilePicture->getClientOriginalExtension(), 'public');

            Log::info('Profile image upload path generated', [
                'user_id' => $user->id,
                'path' => $path,
            ]);

            if ($existing && $existing->image_path) {
                Storage::disk('public')->delete($existing->image_path);
            }

            $profileRecord = $user->profilePicture()->updateOrCreate(
                ['user_id' => $user->id],
                ['image_path' => $path],
            );

            Log::info('Profile picture saved to database', [
                'user_id' => $user->id,
                'record_id' => $profileRecord?->id,
                'image_path' => $profileRecord?->image_path,
            ]);
        }

        return Redirect::route('profile.edit');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
