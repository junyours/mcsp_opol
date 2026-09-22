<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('users')->updateOrInsert(
            [
                'email' => 'admin@gmail.com',
            ],
            [
                'name' => 'Menro Admin',
                'email' => 'admin@gmail.com',
                'password' => Hash::make('admin12345'),
                'role' => 'Admin',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }
}