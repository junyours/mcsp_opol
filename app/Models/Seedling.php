<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Seedling extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'scientific_name',
        'category',
        'quantity',
        'unit',
        'supplier',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(SeedlingStockMovement::class);
    }
}
