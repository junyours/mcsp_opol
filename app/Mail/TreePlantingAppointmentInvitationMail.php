<?php

namespace App\Mail;

use App\Models\TreePlantingAppointment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class TreePlantingAppointmentInvitationMail extends Mailable
{
    use Queueable;

    public function __construct(public TreePlantingAppointment $appointment)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Tree Planting Appointment Member Submission Link',
        );
    }

    public function content(): Content
    {
        $url = route('appointments.public', ['token' => $this->appointment->public_token]);

        return new Content(
            markdown: 'emails.tree-planting-appointment-invitation',
            with: [
                'appointment' => $this->appointment,
                'publicUrl' => $url,
            ],
        );
    }
}
