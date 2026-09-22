<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class TreePlantingAppointment extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'assigned_to',
        'area_id',
        'area_name',
        'appointment_type',
        'service_category',
        'scheduled_date',
        'scheduled_time',
        'location_lat',
        'location_lng',
        'organization_name',
        'representative_name',
        'representative_phone',
        'public_token',
        'status',
        'notes',
    ];

    protected $casts = [
        'scheduled_date' => 'date:Y-m-d',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }

    public function members(): HasMany
    {
        return $this->hasMany(TreePlantingAppointmentMember::class, 'appointment_id');
    }

    public function requirements(): HasOne
    {
        return $this->hasOne(Requirement::class, 'appointment_id');
    }

    public function certificate(): HasOne
    {
        return $this->hasOne(Certificate::class, 'appointment_id');
    }

    public function inventoryRequests(): HasMany
    {
        return $this->hasMany(InventoryRequest::class, 'appointment_id');
    }
}
