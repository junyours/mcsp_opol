<?php

namespace App\Http\Middleware;

use App\Models\TreePlantingAppointment;
use App\Models\Inquiry;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): string|null
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user?->loadMissing('profilePicture'),
            ],
            'pending_appointments_count' => fn () => $user?->role && strtolower($user->role) === 'admin'
                ? TreePlantingAppointment::where('status', 'pending')->count()
                : 0,
            'pending_appointments' => $user?->role && strtolower($user->role) === 'admin'
                ? TreePlantingAppointment::query()
                    ->with('user:id,name')
                    ->where('status', 'pending')
                    ->latest()
                    ->limit(5)
                    ->get(['id', 'user_id', 'appointment_type', 'service_category', 'created_at'])
                : [],
            'staff_active_appointments_count' => $user?->role && strtolower($user->role) === 'staff'
                ? TreePlantingAppointment::where('assigned_to', $user->id)
                    ->whereIn('status', ['ongoing', 'onprocess', 'confirmed', 'confirmend'])
                    ->count()
                : 0,
            'staff_active_appointments' => $user?->role && strtolower($user->role) === 'staff'
                ? TreePlantingAppointment::query()
                    ->with('user:id,name')
                    ->where('assigned_to', $user->id)
                    ->whereIn('status', ['ongoing', 'onprocess', 'confirmed', 'confirmend'])
                    ->latest()
                    ->limit(5)
                    ->get(['id', 'user_id', 'appointment_type', 'service_category', 'status', 'created_at'])
                : [],
            'unread_inquiries_count' => fn () => $user?->role && strtolower($user->role) === 'admin'
                ? Inquiry::where('is_read', false)->count()
                : 0,
            'resident_notifications_count' => fn () => $user?->role && strtolower($user->role) === 'user'
                ? $user->unreadNotifications()->count()
                : 0,
            'resident_notifications' => fn () => $user?->role && strtolower($user->role) === 'user'
                ? $user->unreadNotifications()
                    ->latest()
                    ->limit(10)
                    ->get()
                    ->map(fn ($notification) => [
                        'id' => $notification->id,
                        'data' => $notification->data,
                        'created_at' => $notification->created_at?->toISOString(),
                    ])
                    ->values()
                : [],
            'flash' => [
                'otp_sent' => $request->session()->get('otp_sent'),
                'otp_email' => $request->session()->get('otp_email'),
                'success' => $request->session()->get('success'),
                'public_member' => $request->session()->get('public_member'),
            ],
        ];
    }
}
