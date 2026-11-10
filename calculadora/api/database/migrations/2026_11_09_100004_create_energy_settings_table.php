<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('energy_settings', function (Blueprint $t) {
            $t->id();
            $t->decimal('aneel_tariff_kwh', 10, 6)->nullable();
            $t->date('aneel_valid_from')->nullable();
            $t->date('aneel_valid_to')->nullable();
            $t->string('flag_name')->nullable();
            $t->decimal('flag_add_kwh', 10, 6)->default(0);
            $t->date('flag_competence')->nullable();
            $t->decimal('icms_pct', 5, 2)->default(20);
            $t->decimal('pis_pct', 5, 2)->default(1.10);
            $t->decimal('cofins_pct', 5, 2)->default(5.07);
            $t->boolean('manual_override')->default(false);
            $t->decimal('manual_tariff_kwh', 10, 6)->nullable();
            $t->timestamp('fetched_at')->nullable();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('energy_settings');
    }
};
