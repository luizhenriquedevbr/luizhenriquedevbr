<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Extra extends Model
{
    protected $fillable = ['name', 'unit_price', 'active'];

    protected $casts = ['active' => 'boolean'];

    public function isInUse(): bool
    {
        return PartExtra::where('extra_id', $this->id)->exists();
    }
}
