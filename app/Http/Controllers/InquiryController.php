<?php

namespace App\Http\Controllers;

use App\Models\Inquiry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class InquiryController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'service' => ['nullable', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:5000'],
            'cf_turnstile_response' => ['required', 'string'],
        ]);

        $this->verifyTurnstile($request);

        Inquiry::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'service' => $validated['service'],
            'message' => $validated['message'],
            'is_read' => false,
        ]);

        return back()->with('success', 'Your inquiry has been submitted successfully. MENRO will review it and respond as needed.');
    }

    protected function verifyTurnstile(Request $request): void
    {
        $secretKey = config('services.turnstile.secret_key');
        $token = (string) $request->input('cf_turnstile_response', '');

        if (empty($secretKey) || empty($token)) {
            throw ValidationException::withMessages([
                'cf_turnstile_response' => 'Turnstile verification is required to submit an inquiry.',
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

    public function index(): Response
    {
        return Inertia::render('Admin/Inquiries', [
            'inquiries' => Inquiry::query()->latest()->get(),
        ]);
    }

    public function show(Inquiry $inquiry): Response
    {
        if (! $inquiry->is_read) {
            $inquiry->update(['is_read' => true]);
        }

        return Inertia::render('Admin/InquiryDetails', [
            'inquiry' => $inquiry,
            'previousInquiries' => Inquiry::query()
                ->where('id', '!=', $inquiry->id)
                ->latest()
                ->get(),
        ]);
    }
}
