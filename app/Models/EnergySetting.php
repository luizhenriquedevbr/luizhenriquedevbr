<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EnergySetting extends Model
{
    protected $fillable = [
        'aneel_tariff_kwh', 'aneel_valid_from', 'aneel_valid_to', 'flag_name', 'flag_add_kwh', 'flag_competence',
        'icms_pct', 'pis_pct', 'cofins_pct', 'manual_override', 'manual_tariff_kwh', 'markup_pct', 'fetched_at',
    ];

    protected $casts = [
        'aneel_valid_from' => 'date:Y-m-d',
        'aneel_valid_to' => 'date:Y-m-d',
        'flag_competence' => 'date:Y-m-d',
        'manual_override' => 'boolean',
        'fetched_at' => 'datetime',
    ];

    /** Linha única; cria com os impostos padrão (placeholder: conferir na conta de luz). */
    public static function current(): self
    {
        return static::first() ?? static::create([
            'icms_pct' => '20.00', 'pis_pct' => '1.10', 'cofins_pct' => '5.07',
        ])->refresh();
    }
}
