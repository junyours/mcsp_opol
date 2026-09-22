<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Requirement extends Model
{
    protected $fillable = [
        'appointment_id',
        'images',
    ];

    protected $casts = [
        'images' => 'array',
    ];

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(TreePlantingAppointment::class);
    }
}