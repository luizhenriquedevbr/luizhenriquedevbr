<?php

namespace Tests\Feature;

use App\Models\Extra;
use App\Models\Filament;
use App\Models\Part;
use App\Models\Printer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CadastrosTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Sanctum::actingAs(User::factory()->create());
    }

    public function test_cria_filamento_com_virgula(): void
    {
        $r = $this->postJson('/api/filaments', [
            'name' => 'PLA Preto', 'type' => 'PLA', 'price_per_kg' => '119,90',
        ]);
        $r->assertCreated();
        $this->assertSame('119.90', Filament::first()->price_per_kg);
    }

    public function test_tipo_invalido_422(): void
    {
        $this->postJson('/api/filaments', [
            'name' => 'X', 'type' => 'NYLON', 'price_per_kg' => '100',
        ])->assertStatus(422)->assertJsonValidationErrors('type');
    }

    public function test_excluir_filamento_usado_desativa(): void
    {
        $printer = Printer::create(['name' => 'P', 'power_profiles' => ['PLA' => 170]]);
        $fil = Filament::create(['name' => 'PLA', 'type' => 'PLA', 'price_per_kg' => '100']);
        $part = Part::create([
            'name' => 'Peça', 'printer_id' => $printer->id, 'print_minutes' => 60,
            'cost_total' => '10', 'snapshot' => ['a' => 1], 'calculated_at' => now(),
        ]);
        $part->partFilaments()->create(['filament_id' => $fil->id, 'grams' => '50']);

        $this->deleteJson("/api/filaments/{$fil->id}")
            ->assertOk()->assertJson(['desativado' => true]);

        $this->assertFalse($fil->fresh()->active);
        $this->assertSame(1, $part->fresh()->partFilaments()->count());

        $this->getJson('/api/filaments')->assertJsonCount(0);
        $this->getJson('/api/filaments?todos=1')->assertJsonCount(1);
        $this->patchJson("/api/filaments/{$fil->id}/ativar")->assertOk()->assertJson(['active' => true]);
    }

    public function test_excluir_extra_sem_uso_apaga(): void
    {
        $e = Extra::create(['name' => 'Argola', 'unit_price' => '0.40']);
        $this->deleteJson("/api/extras/{$e->id}")->assertNoContent();
        $this->assertSame(0, Extra::count());
    }

    public function test_potencia_invalida_422(): void
    {
        $this->postJson('/api/printers', [
            'name' => 'X', 'power_profiles' => ['PLA' => 5000],
        ])->assertStatus(422);
    }

    public function test_seed_x2d(): void
    {
        $this->seed(\Database\Seeders\PrinterSeeder::class);
        $this->seed(\Database\Seeders\PrinterSeeder::class);
        $p = Printer::where('name', 'Bambu Lab X2D')->get();
        $this->assertCount(1, $p);
        $this->assertSame(330, $p[0]->power_profiles['ABS']);
        $this->assertSame(10000, $p[0]->lifespan_hours);
    }
}
