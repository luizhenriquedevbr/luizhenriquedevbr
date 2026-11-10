<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('filaments', function (Blueprint $t) {
            $t->id();
            $t->string('name');
            $t->string('type', 10);
            $t->string('color_brand')->nullable();
            $t->decimal('price_per_kg', 10, 2);
            $t->boolean('active')->default(true);
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('filaments');
    }
};
