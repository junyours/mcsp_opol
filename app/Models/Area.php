<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Area extends Model
{
    use HasFactory;

    protected $fillable = [
        'location_name',
        'area_type',
        'corners',
        'status',
    ];

    protected $casts = [
        'corners' => 'array',
    ];

    public function appointments(): HasMany
    {
        return $this->hasMany(TreePlantingAppointment::class);
    }
}
