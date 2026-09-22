<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tree_planting_appointment_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->constrained('tree_planting_appointments')->cascadeOnDelete();
            $table->string('role');
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');
            $table->string('suffix')->nullable();
            $table->string('phone_number');
            $table->string('address');
            $table->string('email')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tree_planting_appointment_members');
    }
};