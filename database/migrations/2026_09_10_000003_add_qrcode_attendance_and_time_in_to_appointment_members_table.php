<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tree_planting_appointment_members', function (Blueprint $table) {
            $table->string('qrcode_path')->nullable()->after('email');
            $table->string('attendance')->default('non-present')->after('qrcode_path');
            $table->timestamp('time_in')->nullable()->after('attendance');
        });
    }

    public function down(): void
    {
        Schema::table('tree_planting_appointment_members', function (Blueprint $table) {
            $table->dropColumn(['qrcode_path', 'attendance', 'time_in']);
        });
    }
};
