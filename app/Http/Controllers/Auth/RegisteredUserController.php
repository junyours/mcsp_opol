<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\RegistrationOtpMail;
use App\Models\User;
use App\Providers\RouteServiceProvider;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register', [
            'turnstileSiteKey' => config('services.turnstile.site_key'),
        ]);
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'terms_accepted' => ['accepted'],
            'website' => ['nullable', 'max:0'],
            'started_at' => ['required', 'integer'],
            'cf_turnstile_response' => ['required', 'string'],
        ]);

        $this->verifyTurnstile($request);

        $validated = $request->all();

        $code = (string) random_int(100000, 999999);

        $request->session()->put('pending_registration', [
            'name' => $validated['name'],
            'email' => strtolower($validated['email']),
            'password' => Hash::make($validated['password']),
            'code' => Hash::make($code),
            'expires_at' => now()->addMinutes(10)->timestamp,
        ]);

        Mail::to($validated['email'])->send(new RegistrationOtpMail($code));

        return redirect()->route('register')->with([
            'otp_sent' => true,
            'otp_email' => $validated['email'],
        ]);
    }

    protected function verifyTurnstile(Request $request): void
    {
        $secretKey = config('services.turnstile.secret_key');
        $token = (string) $request->input('cf_turnstile_response', '');

        if (empty($secretKey) || empty($token)) {
            throw ValidationException::withMessages([
                'cf_turnstile_response' => 'Turnstile verification is required to create an account.',
            ]);
        }

        $response = Http::asForm()->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
            'secret' => $secretKey,
            'response' => $token,
            'remoteip' => $request->ip(),
        ]);

        if (($response->json('success') ?? false) !== true) {
            throw ValidationException::withMessages([
                'cf_turnstile_response' => 'Turnstile verification failed. Please try again.',
            ]);
        }
    }

    public function verifyOtp(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'otp' => ['required', 'digits:6'],
        ]);

        $pending = $request->session()->get('pending_registration');

        if (! $pending || now()->timestamp > $pending['expires_at']) {
            $request->session()->forget('pending_registration');

            return back()->withErrors(['otp' => 'This verification code has expired. Please register again.']);
        }

        if (! Hash::check($validated['otp'], $pending['code'])) {
            return back()->withErrors(['otp' => 'The verification code is incorrect.']);
        }

        $user = User::create([
            'name' => $pending['name'],
            'email' => $pending['email'],
            'password' => $pending['password'],
            'email_verified_at' => now(),
        ]);

        $request->session()->forget('pending_registration');
        event(new Registered($user));

        return redirect()->route('login')->with('success', 'Registration successful. Please log in to continue.');
    }
}
