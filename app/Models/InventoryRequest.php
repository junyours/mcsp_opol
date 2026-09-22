<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'appointment_id',
        'seedling_id',
        'requested_by',
        'reviewed_by',
        'quantity',
        'status',
        'notes',
        'review_notes',
        'reviewed_at',
    ];

    protected $casts = [
        'reviewed_at' => 'datetime',
    ];

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(TreePlantingAppointment::class);
    }

    public function seedling(): BelongsTo
    {
        return $this->belongsTo(Seedling::class);
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}