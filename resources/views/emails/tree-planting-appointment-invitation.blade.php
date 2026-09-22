<x-mail::message>
# Tree Planting Appointment Invitation

Your group appointment has been submitted successfully.

Please complete your member details here:

<x-mail::button :url="$publicUrl">
Submit member details
</x-mail::button>

Or open this link directly:

{{ $publicUrl }}

This link is public and does not require login.

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
