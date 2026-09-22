<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SeedlingStockMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'seedling_id',
        'user_id',
        'movement_type',
        'quantity',
        'notes',
    ];

    public function seedling(): BelongsTo
    {
        return $this->belongsTo(Seedling::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
