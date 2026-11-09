<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Filament extends Model
{
    protected $fillable = ['name', 'type', 'color_brand', 'price_per_kg', 'active'];

    protected $casts = ['active' => 'boolean'];

    public function isInUse(): bool
    {
        return PartFilament::where('filament_id', $this->id)->exists();
    }
}
