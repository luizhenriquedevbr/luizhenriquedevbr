<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('printers', function (Blueprint $t) {
            $t->id();
            $t->string('name');
            $t->decimal('purchase_price', 10, 2)->default(0);
            $t->unsignedInteger('lifespan_hours')->default(10000);
            $t->json('power_profiles');
            $t->boolean('active')->default(true);
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('printers');
    }
};
