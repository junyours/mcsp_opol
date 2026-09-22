<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAreaTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_area_creation_page(): void
    {
        $admin = User::factory()->create([
            'role' => 'Admin',
        ]);

        $response = $this
            ->actingAs($admin)
            ->get('/areas/create');

        $response->assertOk();
    }

    public function test_non_admin_cannot_view_area_creation_page(): void
    {
        $user = User::factory()->create([
            'role' => 'User',
        ]);

        $response = $this
            ->actingAs($user)
            ->get('/areas/create');

        $response->assertForbidden();
    }

    public function test_admin_can_view_area_list_page(): void
    {
        $admin = User::factory()->create([
            'role' => 'Admin',
        ]);

        $response = $this
            ->actingAs($admin)
            ->get('/areas');

        $response->assertOk();
    }

    public function test_admin_can_store_area(): void
    {
        $admin = User::factory()->create([
            'role' => 'Admin',
        ]);

        $response = $this
            ->actingAs($admin)
            ->post('/areas', [
                'location_name' => 'Barangay San Luis',
                'area_type' => 'Residential',
                'corners' => [
                    ['name' => 'Corner 1', 'coordinates' => '8.4878, 124.4659'],
                    ['name' => 'Corner 2', 'coordinates' => '8.4901, 124.4688'],
                    ['name' => 'Corner 3', 'coordinates' => '8.4932, 124.4627'],
                ],
            ]);

        $response->assertRedirect('/areas');
        $this->assertDatabaseHas('areas', [
            'location_name' => 'Barangay San Luis',
            'area_type' => 'Residential',
        ]);
    }
}
