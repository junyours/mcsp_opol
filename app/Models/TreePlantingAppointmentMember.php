<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class TreePlantingAppointmentMember extends Model
{
    use HasFactory;

    protected $table = 'tree_planting_appointment_members';

    protected $fillable = [
        'appointment_id',
        'role',
        'first_name',
        'middle_name',
        'last_name',
        'suffix',
        'phone_number',
        'address',
        'email',
        'profile_picture_path',
        'qrcode_path',
        'attendance',
        'time_in',
    ];

    protected $casts = [
        'time_in' => 'datetime',
    ];

    protected $appends = ['profile_picture_url', 'qrcode_url', 'profile_picture', 'qrcode'];

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(TreePlantingAppointment::class, 'appointment_id');
    }

    public function getProfilePictureUrlAttribute(): ?string
    {
        if (! empty($this->profile_picture_path)) {
            return Storage::disk('public')->url($this->profile_picture_path);
        }

        if (! empty($this->attributes['profile_picture']) && str_starts_with((string) $this->attributes['profile_picture'], 'data:')) {
            return null;
        }

        return $this->attributes['profile_picture'] ?? null;
    }

    public function getProfilePictureAttribute(): ?string
    {
        return $this->profile_picture_url;
    }

    public function getQrcodeUrlAttribute(): ?string
    {
        if (! empty($this->qrcode_path)) {
            return Storage::disk('public')->url($this->qrcode_path);
        }

        if (! empty($this->attributes['qrcode']) && str_starts_with((string) $this->attributes['qrcode'], 'data:')) {
            return null;
        }

        return $this->attributes['qrcode'] ?? null;
    }

    public function getQrcodeAttribute(): ?string
    {
        return $this->qrcode_url;
    }
}
