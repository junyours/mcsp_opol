<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class RegistrationOtpMail extends Mailable
{
    use Queueable;

    public function __construct(public string $code)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Your MENRO registration verification code');
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.registration-otp',
            with: ['code' => $this->code],
        );
    }
}