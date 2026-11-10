<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Printer extends Model
{
    protected $fillable = ['name', 'purchase_price', 'lifespan_hours', 'power_profiles', 'active'];

    protected $casts = ['power_profiles' => 'array', 'active' => 'boolean', 'lifespan_hours' => 'integer'];

    public function parts()
    {
        return $this->hasMany(Part::class);
    }

    public function isInUse(): bool
    {
        return $this->parts()->exists();
    }
}
