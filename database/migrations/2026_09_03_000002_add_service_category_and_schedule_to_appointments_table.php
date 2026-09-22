<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tree_planting_appointments', function (Blueprint $table) {
            $table->enum('service_category', ['Tree Planting', 'Tree Cutting', 'Back Filling'])
                ->default('Tree Planting')
                ->after('appointment_type');
            $table->date('scheduled_date')->nullable()->after('service_category');
        });
    }

    public function down(): void
    {
        Schema::table('tree_planting_appointments', function (Blueprint $table) {
            $table->dropColumn(['service_category', 'scheduled_date']);
        });
    }
};