<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE tree_planting_appointments MODIFY service_category VARCHAR(255) NOT NULL DEFAULT 'Tree Planting'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE tree_planting_appointments MODIFY service_category ENUM('Tree Planting', 'Tree Cutting', 'Back Filling') NOT NULL DEFAULT 'Tree Planting'");
    }
};
