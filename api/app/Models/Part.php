<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Part extends Model
{
    protected $fillable = [
        'name', 'client', 'notes', 'quantity', 'printer_id', 'print_minutes',
        'cost_total', 'snapshot', 'calculated_at',
    ];

    protected $casts = ['snapshot' => 'array', 'calculated_at' => 'datetime'];

    public function printer()
    {
        return $this->belongsTo(Printer::class);
    }

    public function partFilaments()
    {
        return $this->hasMany(PartFilament::class);
    }

    public function partExtras()
    {
        return $this->hasMany(PartExtra::class);
    }
}
