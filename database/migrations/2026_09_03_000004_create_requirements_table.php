<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('requirements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('appointment_id')->unique()->constrained('tree_planting_appointments')->cascadeOnDelete();
            $table->json('images')->nullable()->comment('Document metadata only: names, paths, mime, size, url. No file binary stored here.');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('requirements');
    }
};