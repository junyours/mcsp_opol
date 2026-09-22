<?php

namespace App\Http\Controllers;

use App\Mail\TreePlantingAppointmentInvitationMail;
use App\Models\Area;
use App\Models\Certificate;
use App\Models\TreePlantingAppointment;
use App\Models\User;
use App\Models\Requirement;
use App\Notifications\ResidentAppointmentNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Endroid\QrCode\Builder\Builder;
use Endroid\QrCode\Writer\PngWriter;
use Inertia\Inertia;
use Inertia\Response;

class TreePlantingAppointmentController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/AppointmentList', [
            'appointments' => TreePlantingAppointment::with(['user:id,name,email', 'area:id,location_name', 'assignee:id,name,role'])
                ->withCount('members')
                ->latest()
                ->get(),
            'staff' => User::query()
                ->whereIn('role', ['Staff', 'staff'])
                ->where('status', 'active')
                ->with('profilePicture:id,user_id,image_path')
                ->orderBy('name')
                ->get(['id', 'name', 'role']),
            'users' => User::query()
                ->whereIn('role', ['User', 'user'])
                ->where('status', 'active')
                ->orderBy('name')
                ->get(['id', 'name', 'email']),
            'areas' => Area::query()
                ->orderBy('location_name')
                ->get(['id', 'location_name']),
        ]);
    }

    public function mine(Request $request): Response
    {
        $appointments = $request->user()
            ->appointments()
            ->with([
                'area:id,location_name',
                'requirements',
                'certificate',
                'assignee:id,name,email',
                'assignee.profilePicture:id,user_id,image_path',
                'members' => fn ($query) => $query->latest(),
            ])
            ->latest()
            ->get()
            ->each(function (TreePlantingAppointment $appointment) {
                $appointment->setAttribute('assigned_staff', $appointment->assignee ? [
                    'id' => $appointment->assignee->id,
                    'name' => $appointment->assignee->name,
                    'email' => $appointment->assignee->email,
                    'profile_picture' => $appointment->assignee->profilePicture?->image_url,
                ] : null);
            });

        return Inertia::render('Residents/Myappointments', [
            'appointments' => $appointments,
        ]);
    }

    public function assign(Request $request, TreePlantingAppointment $appointment): RedirectResponse
    {
        $validated = $request->validate([
            'assigned_to' => [
                'nullable',
                Rule::exists('users', 'id')->where(fn ($query) => $query
                    ->whereIn('role', ['Staff', 'staff'])
                    ->where('status', 'active')),
            ],
        ]);

        $assignedTo = $validated['assigned_to'] ?? null;

        $appointment->update([
            'assigned_to' => $assignedTo,
        ]);

        if ($assignedTo && $appointment->wasChanged('assigned_to')) {
            $appointment->load('assignee');
            $this->notifyResidentOfAssignment($appointment);
        }

        if ($assignedTo && $appointment->wasChanged('status')) {
            $this->notifyResidentOfStatus($appointment);
        }

        return back()->with('success', 'Appointment assignment updated successfully.');
    }

    public function startProcess(TreePlantingAppointment $appointment): RedirectResponse
    {
        $this->updateStatusAndNotify($appointment, 'onprocess');

        return back()->with('success', 'Appointment moved to on process.');
    }

    public function schedule(Request $request, TreePlantingAppointment $appointment): RedirectResponse
    {
        Log::info('Appointment schedule request received.', [
            'appointment_id' => $appointment->id,
            'payload' => $request->all(),
        ]);

        $validated = $request->validate([
            'scheduled_date' => ['required', 'date', 'after_or_equal:today'],
            'scheduled_time' => ['required', 'date_format:H:i'],
        ]);

        $updated = $appointment->update($validated);

        Log::info('Appointment schedule saved.', [
            'appointment_id' => $appointment->id,
            'updated' => $updated,
            'scheduled_date' => $appointment->fresh()->scheduled_date?->format('Y-m-d'),
            'scheduled_time' => $appointment->fresh()->scheduled_time,
        ]);

        return back()->with('success', 'Appointment schedule updated successfully.');
    }

    public function remarks(Request $request, TreePlantingAppointment $appointment): RedirectResponse
    {
        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $appointment->update([
            'notes' => $validated['notes'] ?? null,
        ]);

        return back()->with('success', 'Appointment remarks updated successfully.');
    }

    public function approve(TreePlantingAppointment $appointment): RedirectResponse
    {
        $this->updateStatusAndNotify($appointment, 'approved');

        return back()->with('success', 'Appointment approved successfully.');
    }

    public function decline(TreePlantingAppointment $appointment): RedirectResponse
    {
        $this->updateStatusAndNotify($appointment, 'rejected');

        return back()->with('success', 'Appointment declined successfully.');
    }

    public function staffApprove(Request $request, TreePlantingAppointment $appointment): RedirectResponse
    {
        abort_unless($appointment->assigned_to === $request->user()->id, 403);

        return $this->approve($appointment);
    }

    public function staffDecline(Request $request, TreePlantingAppointment $appointment): RedirectResponse
    {
        abort_unless($appointment->assigned_to === $request->user()->id, 403);

        return $this->decline($appointment);
    }

    public function staffComplete(Request $request, TreePlantingAppointment $appointment): RedirectResponse
    {
        abort_unless($appointment->assigned_to === $request->user()->id, 403);

        $this->updateStatusAndNotify($appointment, 'completed');

        return back()->with('success', 'Appointment completed successfully.');
    }

    public function storeRequirements(Request $request, TreePlantingAppointment $appointment): RedirectResponse
    {
        abort_unless($request->user()->id === $appointment->user_id, 403);

        $requiredDocuments = match ($appointment->service_category) {
            'Tree Planting' => ['OR for Tree Planting', 'Proof of Planting'],
            'Tree Cutting' => ['Barangay Clearance', 'OR for Tree Cutting'],
            'Back Filling' => ['Zoning Clearance', 'OR for Back Filling', 'Site Development Plan'],
            'Special Waste Collection' => ['OR for Special Waste Collection'],
            default => [],
        };

        $files = $request->file('images', []);

        if (empty($files) || count($files) !== count($requiredDocuments) || array_diff($requiredDocuments, array_keys($files))) {
            return back()->withErrors(['requirements' => 'Please upload every required document for this service.']);
        }

        $storedImages = [];

        foreach ($files as $documentName => $file) {
            if (! $file instanceof \Illuminate\Http\UploadedFile || ! $file->isValid()) {
                return back()->withErrors(['requirements' => 'One or more uploaded files are invalid.']);
            }

            if (! in_array($documentName, $requiredDocuments, true)) {
                return back()->withErrors(['requirements' => 'The uploaded document is not allowed for this service.']);
            }

            $extension = strtolower((string) $file->getClientOriginalExtension() ?: pathinfo($file->getClientOriginalName(), PATHINFO_EXTENSION));
            $safeName = Str::slug(str_replace(['/', '\\'], '-', $documentName), '-') ?: 'document';
            $storedPath = $file->storeAs(
                'requirements/' . $appointment->id,
                $safeName . '-' . time() . '-' . Str::uuid() . ($extension ? '.' . $extension : ''),
                'public'
            );

            if (! is_string($storedPath)) {
                return back()->withErrors(['requirements' => 'The uploaded documents could not be saved.']);
            }

            $storedImages[] = [
                'name' => $documentName,
                'path' => $storedPath,
                'mime' => $file->getMimeType() ?: 'application/octet-stream',
                'size' => $file->getSize(),
                'url' => Storage::disk('public')->url($storedPath),
            ];
        }

        Requirement::updateOrCreate(
            ['appointment_id' => $appointment->id],
            ['images' => $storedImages],
        );

        return back()->with('success', 'Requirements uploaded successfully.');
    }

    public function deleteRequirements(Request $request, TreePlantingAppointment $appointment): JsonResponse
    {
        $user = $request->user();
        abort_unless($user && ($user->id === $appointment->user_id || strtolower((string) $user->role) === 'admin'), 403);

        $documentName = $request->input('name');
        if (! is_string($documentName) || trim($documentName) === '') {
            return response()->json(['message' => 'Please select a requirement to delete.'], 422);
        }

        $requirement = $appointment->requirements()->first();
        abort_unless($requirement, 404);

        $images = $requirement->images ?? [];
        $filteredImages = array_values(array_filter($images, fn ($image) => ($image['name'] ?? null) !== $documentName));

        foreach ($images as $image) {
            if (($image['name'] ?? null) === $documentName) {
                $path = $image['path'] ?? null;
                if (is_string($path) && $path !== '') {
                    Storage::disk('public')->delete($path);
                }
            }
        }

        if (count($filteredImages) === 0) {
            $requirement->delete();
        } else {
            $requirement->update(['images' => $filteredImages]);
        }

        $appointment->update(['status' => 'onprocess']);

        return response()->json([
            'message' => 'Requirement deleted successfully. Please upload the required documents again.',
            'images' => $filteredImages,
        ]);
    }

    public function certificateFiles(): Response
    {
        $certificateGroups = Certificate::query()
            ->with([
                'appointment:id,service_category,status,user_id',
                'appointment.user:id,name',
                'uploader:id,name',
            ])
            ->latest()
            ->get()
            ->groupBy(fn (Certificate $certificate) => $certificate->appointment?->service_category ?? 'Unspecified')
            ->map(function ($certificates, $serviceCategory) {
                return [
                    'service_category' => $serviceCategory,
                    'count' => $certificates->count(),
                    'certificates' => $certificates->map(fn (Certificate $certificate) => [
                        'id' => $certificate->id,
                        'appointment_id' => $certificate->appointment_id,
                        'original_name' => $certificate->original_name,
                        'mime_type' => $certificate->mime_type,
                        'file_size' => $certificate->file_size,
                        'uploaded_at' => $certificate->created_at?->format('M d, Y'),
                        'uploaded_by' => $certificate->uploader?->name ?? 'Unknown user',
                        'requester' => $certificate->appointment?->user?->name ?? 'Resident',
                        'status' => $certificate->appointment?->status ?? 'unknown',
                        'view_url' => route('appointments.certificate.view', $certificate->appointment_id),
                    ])->values(),
                ];
            })
            ->sortBy(fn ($group) => $group['service_category'])
            ->values();

        return Inertia::render('Admin/CertificateFiles', [
            'certificateGroups' => $certificateGroups,
        ]);
    }

    public function members(TreePlantingAppointment $appointment): Response
    {
        $appointment->load([
            'user:id,name,email',
            'area:id,location_name',
            'requirements',
            'certificate',
            'members' => fn ($query) => $query->latest(),
        ]);

        return Inertia::render('Admin/AppointmentMembers', [
            'appointment' => $appointment,
        ]);
    }

    public function deleteMember(TreePlantingAppointment $appointment, int $memberId)
    {
        $member = $appointment->members()->whereKey($memberId)->firstOrFail();
        $member->delete();

        return response()->json([
            'message' => 'Appointment member deleted successfully.',
        ]);
    }

    public function uploadCertificate(Request $request, TreePlantingAppointment $appointment): RedirectResponse
    {
        $validated = $request->validate([
            'certificate' => ['required', 'file', 'mimes:pdf', 'max:10240'],
        ]);

        $existingCertificate = $appointment->certificate;
        $file = $validated['certificate'];

        if ($existingCertificate && $existingCertificate->file_path) {
            Storage::disk('public')->delete($existingCertificate->file_path);
            $existingCertificate->delete();
        }

        $storedPath = $file->storeAs(
            'certificates/' . $appointment->id,
            'certificate-' . $appointment->id . '-' . time() . '.pdf',
            'public'
        );

        Certificate::create([
            'appointment_id' => $appointment->id,
            'uploaded_by' => $request->user()->id,
            'file_path' => $storedPath,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType() ?: 'application/pdf',
            'file_size' => $file->getSize(),
        ]);

        return back()->with('success', 'Certificate uploaded successfully.');
    }

    private function updateStatusAndNotify(TreePlantingAppointment $appointment, string $status): void
    {
        if ($appointment->status === $status) {
            return;
        }

        $appointment->update(['status' => $status]);
        $this->notifyResidentOfStatus($appointment);
    }

    private function notifyResidentOfAssignment(TreePlantingAppointment $appointment): void
    {
        $appointment->loadMissing(['user', 'assignee']);

        if ($appointment->user && strtolower((string) $appointment->user->role) === 'user') {
            $appointment->user->notify(new ResidentAppointmentNotification($appointment, 'assigned'));
        }
    }

    private function notifyResidentOfStatus(TreePlantingAppointment $appointment): void
    {
        $appointment->loadMissing('user');

        if ($appointment->user && strtolower((string) $appointment->user->role) === 'user') {
            $appointment->user->notify(new ResidentAppointmentNotification($appointment, 'status', $appointment->status));
        }
    }

    public function certificate(Request $request, TreePlantingAppointment $appointment)
    {
        abort_unless(
            $request->user()->id === $appointment->user_id
                || strtolower((string) $request->user()->role) === 'admin',
            403
        );

        $certificate = $appointment->certificate;
        abort_unless($certificate && ! empty($certificate->file_path), 404);

        $filePath = Storage::disk('public')->path($certificate->file_path);
        abort_unless(file_exists($filePath), 404);

        return response()->file($filePath, [
            'Content-Type' => $certificate->mime_type,
            'Content-Disposition' => 'inline; filename="' . addslashes($certificate->original_name) . '"',
            'Cache-Control' => 'private, max-age=3600',
        ]);
    }

    public function scanMemberAttendance(Request $request, TreePlantingAppointment $appointment)
    {
        $validated = $request->validate([
            'member_id' => ['nullable', 'integer'],
            'appointment_id' => ['nullable', 'integer'],
            'qr_data' => ['nullable', 'string', 'max:2000'],
        ]);

        $memberId = $validated['member_id'] ?? null;
        $appointmentId = $validated['appointment_id'] ?? null;

        if ((!$memberId || !$appointmentId) && !empty($validated['qr_data'])) {
            $rawQrData = urldecode(trim($validated['qr_data']));
            $payload = json_decode($rawQrData, true);
            if (is_string($payload)) {
                $payload = json_decode($payload, true);
            }

            $memberId = $payload['member_id'] ?? null;
            $appointmentId = $payload['appointment_id'] ?? null;

            if (!$memberId || !$appointmentId) {
                preg_match('/member[_-]?id\s*[=:]\s*["\']?(\d+)/i', $rawQrData, $memberMatch);
                preg_match('/appointment[_-]?id\s*[=:]\s*["\']?(\d+)/i', $rawQrData, $appointmentMatch);
                $memberId = $memberMatch[1] ?? null;
                $appointmentId = $appointmentMatch[1] ?? null;
            }
        }

        abort_unless($memberId && $appointmentId, 422, 'This is not a valid member QR code.');
        abort_unless((int) $appointmentId === (int) $appointment->id, 422, 'This QR code belongs to another appointment.');
        $userRole = strtolower((string) $request->user()->role);
        $isAuthorizedStaff = in_array($userRole, ['staff', 'admin'], true)
            && ($userRole === 'admin' || $appointment->assigned_to === $request->user()->id || $appointment->assigned_to === null);

        abort_unless($isAuthorizedStaff, 403, 'You are not authorized to scan attendance for this appointment.');

        $member = $appointment->members()
            ->whereKey($memberId)
            ->firstOrFail();

        $member->update([
            'attendance' => 'present',
            'time_in' => now(),
        ]);

        return response()->json([
            'member' => $member->fresh(),
            'message' => 'Attendance recorded successfully.',
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'appointment_type' => ['required', 'in:individual,couple,school'],
            'service_category' => [
                'required',
                Rule::in($request->input('appointment_type') === 'individual'
                    ? ['Tree Planting', 'Tree Cutting', 'Back Filling', 'Special Waste Collection']
                    : ['Tree Planting']),
            ],
            'scheduled_date' => ['required_if:appointment_type,couple,school', 'nullable', 'date', 'after_or_equal:today'],
            'area_id' => ['nullable', 'exists:areas,id'],
            'area_name' => ['required_if:appointment_type,individual', 'nullable', 'string', 'max:255'],
            'organization_name' => ['required_if:appointment_type,school', 'nullable', 'string', 'max:255'],
            'representative_name' => ['required_if:appointment_type,school', 'nullable', 'string', 'max:255'],
            'representative_phone' => ['required_if:appointment_type,school', 'nullable', 'string', 'max:255'],
            'participants' => ['exclude_unless:appointment_type,individual,couple', 'required', 'array', 'size:' . ($request->input('appointment_type') === 'individual' ? 1 : 2)],
            'participants.*.role' => ['required', 'in:individual,male,female'],
            'participants.*.first_name' => ['required', 'string', 'max:255'],
            'participants.*.middle_name' => ['nullable', 'string', 'max:255'],
            'participants.*.last_name' => ['required', 'string', 'max:255'],
            'participants.*.suffix' => ['nullable', 'string', 'max:255'],
            'participants.*.phone_number' => ['required', 'string', 'max:255'],
            'participants.*.address' => ['required', 'string', 'max:255'],
        ]);

        try {
            $appointment = DB::transaction(function () use ($request, $validated) {
                $appointment = TreePlantingAppointment::create([
                    'user_id' => $request->user()->id,
                    'area_id' => $validated['appointment_type'] === 'individual' ? null : ($validated['area_id'] ?? null),
                    'area_name' => $validated['appointment_type'] === 'individual' ? $validated['area_name'] : null,
                    'appointment_type' => $validated['appointment_type'],
                    'service_category' => $validated['service_category'],
                    'scheduled_date' => $validated['scheduled_date'] ?? null,
                    'organization_name' => $validated['organization_name'] ?? null,
                    'representative_name' => $validated['representative_name'] ?? null,
                    'representative_phone' => $validated['representative_phone'] ?? null,
                    'public_token' => (string) Str::uuid(),
                ]);

                if (in_array($appointment->appointment_type, ['individual', 'couple'], true)) {
                    $appointment->members()->createMany($validated['participants']);
                }

                return $appointment;
            });
        } catch (\Throwable $exception) {
            Log::error('Tree planting appointment database insert failed.', [
                'user_id' => $request->user()->id,
                'exception' => $exception->getMessage(),
            ]);

            return back()->withErrors([
                'appointment' => 'The appointment could not be saved. Please check the database structure and try again.',
            ]);
        }

        if ($appointment->appointment_type === 'school') {
            try {
                Mail::to($request->user()->email)->send(new TreePlantingAppointmentInvitationMail($appointment));
            } catch (\Throwable $exception) {
                Log::error('Tree planting appointment invitation email failed.', [
                    'appointment_id' => $appointment->id,
                    'recipient' => $request->user()->email,
                    'exception' => $exception->getMessage(),
                ]);

                return back()->withErrors([
                    'email' => 'The appointment was saved, but the invitation email could not be sent. Check the SMTP settings and try again.',
                ]);
            }
        }

        return back()->with('success', $appointment->appointment_type === 'individual'
            ? 'Your individual appointment request has been submitted successfully.'
            : ($appointment->appointment_type === 'couple'
            ? 'Your couple appointment request has been submitted successfully.'
            : 'Your organization appointment has been submitted. The member invitation link was sent to your registered email.'));
    }

    public function storeAdmin(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'user_id' => [
                'required',
                Rule::exists('users', 'id')->where(fn ($query) => $query
                    ->whereIn('role', ['User', 'user'])
                    ->where('status', 'active')),
            ],
            'appointment_type' => ['required', 'in:individual,couple,school'],
            'service_category' => [
                'required',
                Rule::in($request->input('appointment_type') === 'individual'
                    ? ['Tree Planting', 'Tree Cutting', 'Back Filling', 'Special Waste Collection']
                    : ['Tree Planting']),
            ],
            'scheduled_date' => ['required_if:appointment_type,couple,school', 'nullable', 'date', 'after_or_equal:today'],
            'area_id' => ['nullable', 'exists:areas,id'],
            'area_name' => ['required_if:appointment_type,individual', 'nullable', 'string', 'max:255'],
            'organization_name' => ['required_if:appointment_type,school', 'nullable', 'string', 'max:255'],
            'representative_name' => ['required_if:appointment_type,school', 'nullable', 'string', 'max:255'],
            'representative_phone' => ['required_if:appointment_type,school', 'nullable', 'string', 'max:255'],
            'participants' => ['exclude_unless:appointment_type,individual,couple', 'required', 'array', 'size:' . ($request->input('appointment_type') === 'individual' ? 1 : 2)],
            'participants.*.role' => ['required', 'in:individual,male,female'],
            'participants.*.first_name' => ['required', 'string', 'max:255'],
            'participants.*.middle_name' => ['nullable', 'string', 'max:255'],
            'participants.*.last_name' => ['required', 'string', 'max:255'],
            'participants.*.suffix' => ['nullable', 'string', 'max:255'],
            'participants.*.phone_number' => ['required', 'string', 'max:255'],
            'participants.*.address' => ['required', 'string', 'max:255'],
        ]);

        $resident = User::query()->findOrFail($validated['user_id']);

        try {
            $appointment = DB::transaction(function () use ($validated) {
                $appointment = TreePlantingAppointment::create([
                    'user_id' => $validated['user_id'],
                    'area_id' => $validated['appointment_type'] === 'individual' ? null : ($validated['area_id'] ?? null),
                    'area_name' => $validated['appointment_type'] === 'individual' ? $validated['area_name'] : null,
                    'appointment_type' => $validated['appointment_type'],
                    'service_category' => $validated['service_category'],
                    'scheduled_date' => $validated['scheduled_date'] ?? null,
                    'organization_name' => $validated['organization_name'] ?? null,
                    'representative_name' => $validated['representative_name'] ?? null,
                    'representative_phone' => $validated['representative_phone'] ?? null,
                    'public_token' => (string) Str::uuid(),
                ]);

                if (in_array($appointment->appointment_type, ['individual', 'couple'], true)) {
                    $appointment->members()->createMany($validated['participants']);
                }

                return $appointment;
            });
        } catch (\Throwable $exception) {
            Log::error('Admin-created appointment database insert failed.', [
                'user_id' => $validated['user_id'],
                'exception' => $exception->getMessage(),
            ]);

            return back()->withErrors([
                'appointment' => 'The appointment could not be saved. Please check the database structure and try again.',
            ]);
        }

        if ($appointment->appointment_type === 'school') {
            try {
                Mail::to($resident->email)->send(new TreePlantingAppointmentInvitationMail($appointment));
            } catch (\Throwable $exception) {
                Log::error('Admin-created appointment invitation email failed.', [
                    'appointment_id' => $appointment->id,
                    'recipient' => $resident->email,
                    'exception' => $exception->getMessage(),
                ]);

                return back()->withErrors([
                    'email' => 'The appointment was saved, but the invitation email could not be sent. Check the SMTP settings and try again.',
                ]);
            }
        }

        return back()->with('success', 'Appointment created successfully for ' . $resident->name . '.');
    }

    public function publicForm(string $token): Response
    {
        $appointment = TreePlantingAppointment::where('public_token', $token)->firstOrFail();

        abort_unless($appointment->appointment_type === 'school', 404);

        return Inertia::render('Appointments/PublicMemberForm', [
            'appointment' => [
                'organization_name' => $appointment->organization_name,
                'token' => $appointment->public_token,
            ],
        ]);
    }

    public function storePublicMember(Request $request, string $token): RedirectResponse
    {
        $appointment = TreePlantingAppointment::where('public_token', $token)->firstOrFail();

        abort_unless($appointment->appointment_type === 'school', 404);

        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'suffix' => ['nullable', 'string', 'max:255'],
            'phone_number' => ['required', 'string', 'max:255'],
            'address' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'profile_picture' => ['required', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
        ]);

        $duplicateMember = $appointment->members()
            ->whereRaw('LOWER(TRIM(first_name)) = ?', [mb_strtolower(trim($validated['first_name']))])
            ->whereRaw('LOWER(TRIM(COALESCE(middle_name, \'\'))) = ?', [mb_strtolower(trim($validated['middle_name'] ?? ''))])
            ->whereRaw('LOWER(TRIM(last_name)) = ?', [mb_strtolower(trim($validated['last_name']))])
            ->exists();

        if ($duplicateMember) {
            return back()->withErrors([
                'member' => 'This member has already been submitted for this appointment.',
            ]);
        }

        $profilePicture = $validated['profile_picture'];
        unset($validated['profile_picture']);

        $member = $appointment->members()->create([
            ...$validated,
            'role' => 'member',
        ]);

        $profilePath = $profilePicture->storeAs(
            'member-photos/' . $appointment->id,
            'member-' . $member->id . '-' . time() . '.' . $profilePicture->getClientOriginalExtension(),
            'public'
        );

        $member->update(['profile_picture_path' => $profilePath]);

        $qrPayload = json_encode([
            'member_id' => $member->id,
            'appointment_id' => $appointment->id,
            'token' => (string) Str::uuid(),
        ], JSON_THROW_ON_ERROR);
        $qrCode = Builder::create()
            ->writer(new PngWriter())
            ->data($qrPayload)
            ->size(800)
            ->margin(24)
            ->build();

        $qrPath = 'member-qrcodes/' . $appointment->id . '/member-' . $member->id . '-' . time() . '.png';
        Storage::disk('public')->put($qrPath, $qrCode->getString());
        $member->update(['qrcode_path' => $qrPath]);

        return back()->with('public_member', [
            'name' => trim(implode(' ', array_filter([
                $member->first_name,
                $member->middle_name,
                $member->last_name,
                $member->suffix,
            ]))),
            'qrcode' => Storage::disk('public')->url($qrPath),
        ]);
    }
}