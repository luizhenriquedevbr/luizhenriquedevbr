<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PartFilament extends Model
{
    public $timestamps = false;

    protected $fillable = ['part_id', 'filament_id', 'grams'];

    public function filament()
    {
        return $this->belongsTo(Filament::class);
    }
}
