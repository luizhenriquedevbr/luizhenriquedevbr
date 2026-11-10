<?php

namespace Database\Seeders;

use App\Models\EnergySetting;
use Illuminate\Database\Seeder;

class EnergySettingSeeder extends Seeder
{
    public function run(): void
    {
        EnergySetting::current(); // cria se faltar; não sobrescreve edições
    }
}
