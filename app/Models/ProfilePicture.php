<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class ProfilePicture extends Model
{
    protected $table = 'profile_picture';

    protected $fillable = [
        'user_id',
        'image_path',
    ];

    protected $appends = ['image_url', 'image'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getImageUrlAttribute(): ?string
    {
        if (! empty($this->image_path)) {
            return Storage::disk('public')->url($this->image_path);
        }

        if (! empty($this->attributes['image']) && str_starts_with((string) $this->attributes['image'], 'data:')) {
            return null;
        }

        return $this->attributes['image'] ?? null;
    }

    public function getImageAttribute(): ?string
    {
        return $this->image_url;
    }
}
