<?php

namespace Tests\Feature;

use App\Models\Area;
use App\Models\Certificate;
use App\Models\Requirement;
use App\Models\TreePlantingAppointment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class TreePlantingAppointmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_submit_couple_appointment(): void
    {
        Mail::fake();

        $user = User::factory()->create([
            'role' => 'User',
            'email' => 'resident@example.com',
        ]);

        Area::create([
            'location_name' => 'Barangay San Luis',
            'area_type' => 'Residential',
            'corners' => [
                ['name' => 'Corner 1', 'coordinates' => '8.5001,124.6001'],
                ['name' => 'Corner 2', 'coordinates' => '8.5005,124.6009'],
                ['name' => 'Corner 3', 'coordinates' => '8.5012,124.6015'],
            ],
            'status' => 'active',
        ]);

        $response = $this->actingAs($user)->post('/appointments', [
            'appointment_type' => 'couple',
            'area_id' => 1,
            'location_lat' => 8.5007,
            'location_lng' => 124.6010,
            'participants' => [
                [
                    'role' => 'male',
                    'first_name' => 'Pedro',
                    'middle_name' => 'M.',
                    'last_name' => 'Dela Cruz',
                    'suffix' => 'Jr.',
                    'phone_number' => '09171234567',
                    'address' => 'Barangay San Luis',
                ],
                [
                    'role' => 'female',
                    'first_name' => 'Maria',
                    'middle_name' => 'A.',
                    'last_name' => 'Dela Cruz',
                    'suffix' => '',
                    'phone_number' => '09181234567',
                    'address' => 'Barangay San Luis',
                ],
            ],
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('tree_planting_appointments', [
            'user_id' => $user->id,
            'appointment_type' => 'couple',
        ]);
        $this->assertDatabaseHas('tree_planting_appointment_members', [
            'role' => 'male',
            'last_name' => 'Dela Cruz',
        ]);
        Mail::assertSent(\Illuminate\Mail\Mailables\Markdown::class);
    }

    public function test_deleting_requirement_requires_resubmission(): void
    {
        $user = User::factory()->create([
            'role' => 'User',
            'email' => 'resident@example.com',
        ]);

        $area = Area::create([
            'location_name' => 'Barangay San Luis',
            'area_type' => 'Residential',
            'corners' => [
                ['name' => 'Corner 1', 'coordinates' => '8.5001,124.6001'],
            ],
            'status' => 'active',
        ]);

        $appointment = TreePlantingAppointment::create([
            'user_id' => $user->id,
            'area_id' => $area->id,
            'appointment_type' => 'couple',
            'service_category' => 'Tree Planting',
            'status' => 'approved',
        ]);

        Requirement::create([
            'appointment_id' => $appointment->id,
            'images' => [
                [
                    'name' => 'OR for Tree Planting',
                    'path' => 'requirements/' . $appointment->id . '/or.pdf',
                    'mime' => 'application/pdf',
                    'size' => 1250,
                    'url' => 'https://example.com/or.pdf',
                ],
            ],
        ]);

        $this->actingAs($user)
            ->deleteJson('/appointments/' . $appointment->id . '/requirements', ['name' => 'OR for Tree Planting'])
            ->assertOk()
            ->assertJsonPath('message', 'Requirement deleted successfully. Please upload the required documents again.');

        $this->assertDatabaseMissing('requirements', [
            'appointment_id' => $appointment->id,
        ]);

        $this->assertDatabaseHas('tree_planting_appointments', [
            'id' => $appointment->id,
            'status' => 'onprocess',
        ]);
    }

    public function test_admin_can_view_certificates_grouped_by_service(): void
    {
        $admin = User::factory()->create([
            'role' => 'Admin',
            'email' => 'admin@example.com',
        ]);

        $user = User::factory()->create([
            'role' => 'User',
            'email' => 'resident@example.com',
        ]);

        $area = Area::create([
            'location_name' => 'Barangay San Luis',
            'area_type' => 'Residential',
            'corners' => [
                ['name' => 'Corner 1', 'coordinates' => '8.5001,124.6001'],
            ],
            'status' => 'active',
        ]);

        $appointment = TreePlantingAppointment::create([
            'user_id' => $user->id,
            'area_id' => $area->id,
            'appointment_type' => 'couple',
            'service_category' => 'Tree Planting',
            'status' => 'completed',
        ]);

        Certificate::create([
            'appointment_id' => $appointment->id,
            'uploaded_by' => $admin->id,
            'file_path' => 'data:application/pdf;base64,ZmFrZQ==',
            'original_name' => 'sample-certificate.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 123,
        ]);

        $this->actingAs($admin)
            ->get('/certificates')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Admin/CertificateFiles')
                ->has('certificateGroups', 1)
                ->where('certificateGroups.0.service_category', 'Tree Planting')
                ->where('certificateGroups.0.certificates.0.original_name', 'sample-certificate.pdf'));
    }
}
