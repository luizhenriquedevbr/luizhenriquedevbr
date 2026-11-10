<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Lucro sobre o custo (100 = preço de venda é o dobro do custo). Fica na mesma linha única de configuração.
return new class extends Migration {
    public function up(): void
    {
        Schema::table('energy_settings', function (Blueprint $t) {
            $t->decimal('markup_pct', 6, 2)->default(100)->after('manual_tariff_kwh');
        });
    }

    public function down(): void
    {
        Schema::table('energy_settings', function (Blueprint $t) {
            $t->dropColumn('markup_pct');
        });
    }
};
