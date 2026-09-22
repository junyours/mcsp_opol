<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tree_planting_appointments', function (Blueprint $table) {
            $table->string('public_token')->nullable();
        });

        DB::table('tree_planting_appointments')
            ->whereNull('public_token')
            ->orderBy('id')
            ->eachById(function ($appointment) {
                DB::table('tree_planting_appointments')
                    ->where('id', $appointment->id)
                    ->update(['public_token' => (string) Str::uuid()]);
            });

        Schema::table('tree_planting_appointments', function (Blueprint $table) {
            $table->unique('public_token');
        });
    }

    public function down(): void
    {
        Schema::table('tree_planting_appointments', function (Blueprint $table) {
            $table->dropUnique(['public_token']);
            $table->dropColumn('public_token');
        });
    }
};