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

    public function test_preco_vazio_impressora_usa_default(): void
    {
        $pw = ['PLA' => 170];
        $r = $this->postJson('/api/printers', ['name' => 'A', 'purchase_price' => '', 'power_profiles' => $pw]);
        $r->assertCreated()->assertJsonPath('purchase_price', '0.00');
        $id = $r->json('id');
        $this->putJson("/api/printers/$id", ['purchase_price' => '1.500,50'])->assertOk();
        $this->putJson("/api/printers/$id", ['purchase_price' => ''])->assertOk()
            ->assertJsonPath('purchase_price', '1500.50');
        $this->postJson('/api/printers', ['name' => 'B', 'purchase_price' => null, 'power_profiles' => $pw])->assertCreated();
    }

    public function test_power_profiles_estrito(): void
    {
        $this->postJson('/api/printers', ['name' => 'X', 'power_profiles' => [170, 200]])
            ->assertStatus(422)->assertJsonValidationErrors('power_profiles');
        $this->postJson('/api/printers', ['name' => 'X', 'power_profiles' => ['NYLON' => 170]])
            ->assertStatus(422)->assertJsonValidationErrors('power_profiles');
        $this->postJson('/api/printers', ['name' => 'X', 'power_profiles' => ['PLA' => '170']])
            ->assertStatus(422)->assertJsonValidationErrors('power_profiles');
        $this->postJson('/api/printers', ['name' => 'X', 'power_profiles' => ['PLA' => 170, 'ABS' => 330]])
            ->assertCreated()->assertJsonPath('power_profiles.ABS', 330);
        $this->assertSame(330, Printer::first()->power_profiles['ABS']);
    }

    public function test_decimal_nao_escalar_422(): void
    {
        $this->postJson('/api/filaments', ['name' => 'X', 'type' => 'PLA', 'price_per_kg' => [1]])
            ->assertStatus(422)->assertJsonValidationErrors('price_per_kg');
        $this->postJson('/api/extras', ['name' => 'X', 'unit_price' => ['a' => 1]])
            ->assertStatus(422)->assertJsonValidationErrors('unit_price');
        $this->postJson('/api/printers', ['name' => 'X', 'purchase_price' => [1], 'power_profiles' => ['PLA' => 1]])
            ->assertStatus(422)->assertJsonValidationErrors('purchase_price');
    }

    public function test_reseed_preserva_edicao(): void
    {
        $this->seed(\Database\Seeders\PrinterSeeder::class);
        $p = Printer::first();
        $p->update(['purchase_price' => '15000', 'power_profiles' => ['PLA' => 100]]);
        $this->seed(\Database\Seeders\PrinterSeeder::class);
        $p->refresh();
        $this->assertSame('15000.00', $p->purchase_price);
        $this->assertSame(['PLA' => 100], $p->power_profiles);
    }
}
