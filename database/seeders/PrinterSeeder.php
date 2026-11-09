<?php

namespace Database\Seeders;

use App\Models\Printer;
use Illuminate\Database\Seeder;

class PrinterSeeder extends Seeder
{
    public function run(): void
    {
        Printer::updateOrCreate(['name' => 'Bambu Lab X2D'], [
            'purchase_price' => 0,
            'lifespan_hours' => 10000,
            'power_profiles' => ['PLA' => 170, 'PETG' => 170, 'TPU' => 170, 'ABS' => 330, 'ASA' => 330, 'PC' => 330],
        ]);
    }
}
