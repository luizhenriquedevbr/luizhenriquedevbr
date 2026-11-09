<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('parts', function (Blueprint $t) {
            $t->id();
            $t->string('name');
            $t->string('client')->nullable();
            $t->text('notes')->nullable();
            $t->unsignedInteger('quantity')->default(1);
            $t->foreignId('printer_id')->constrained()->restrictOnDelete();
            $t->unsignedInteger('print_minutes');
            $t->decimal('cost_total', 10, 2);
            $t->json('snapshot');
            $t->timestamp('calculated_at');
            $t->timestamps();
        });

        Schema::create('part_filaments', function (Blueprint $t) {
            $t->id();
            $t->foreignId('part_id')->constrained()->cascadeOnDelete();
            $t->foreignId('filament_id')->constrained()->restrictOnDelete();
            $t->decimal('grams', 10, 2);
        });

        Schema::create('part_extras', function (Blueprint $t) {
            $t->id();
            $t->foreignId('part_id')->constrained()->cascadeOnDelete();
            $t->foreignId('extra_id')->constrained()->restrictOnDelete();
            $t->decimal('quantity', 10, 2);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('part_extras');
        Schema::dropIfExists('part_filaments');
        Schema::dropIfExists('parts');
    }
};
