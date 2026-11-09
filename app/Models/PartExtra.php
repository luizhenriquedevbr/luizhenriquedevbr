<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PartExtra extends Model
{
    public $timestamps = false;

    protected $fillable = ['part_id', 'extra_id', 'quantity'];

    public function extra()
    {
        return $this->belongsTo(Extra::class);
    }
}
