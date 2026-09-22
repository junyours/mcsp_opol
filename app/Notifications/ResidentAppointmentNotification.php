<?php

namespace App\Notifications;

use App\Models\TreePlantingAppointment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\DatabaseMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;

class ResidentAppointmentNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly TreePlantingAppointment $appointment,
        private readonly string $kind,
        private readonly ?string $status = null,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): DatabaseMessage
    {
        $service = $this->appointment->service_category
            ?: Str::headline($this->appointment->appointment_type ?: 'appointment');

        if ($this->kind === 'assigned') {
            $staffName = $this->appointment->assignee?->name ?: 'a MENRO staff member';

            return new DatabaseMessage([
                'kind' => 'assigned',
                'title' => 'Staff assigned',
                'message' => "{$staffName} has been assigned to your {$service} appointment.",
                'appointment_id' => $this->appointment->id,
                'assigned_staff' => $staffName,
            ]);
        }

        $label = Str::headline($this->status ?: 'pending');
        $title = $this->status === 'rejected' ? 'Appointment rejected' : 'Appointment status updated';
        $message = $this->status === 'rejected'
            ? "Your {$service} appointment was rejected."
            : "Your {$service} appointment is now {$label}.";

        return new DatabaseMessage([
            'kind' => 'status',
            'title' => $title,
            'message' => $message,
            'appointment_id' => $this->appointment->id,
            'status' => $this->status,
        ]);
    }
}
