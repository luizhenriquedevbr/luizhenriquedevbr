<?php

namespace Tests\Feature;

use App\Models\EnergySetting;
use App\Models\Extra;
use App\Models\Filament;
use App\Models\Part;
use App\Models\Printer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PartsTest extends TestCase
{
    use RefreshDatabase;

    private Printer $printer;
    private Filament $filament;
    private Extra $e1;
    private Extra $e2;

    protected function setUp(): void
    {
        parent::setUp();
        Sanctum::actingAs(User::factory()->create());
        EnergySetting::current()->update(['manual_override' => true, 'manual_tariff_kwh' => '1.10']);
        $this->printer = Printer::create(['name' => 'X2D', 'purchase_price' => '15000', 'lifespan_hours' => 10000,
            'power_profiles' => ['PLA' => 170, 'ABS' => 330], 'active' => true]);
        $this->filament = Filament::create(['name' => 'PLA Preto', 'type' => 'PLA', 'price_per_kg' => '120', 'active' => true]);
        $this->e1 = Extra::create(['name' => 'Argola', 'unit_price' => '0.40', 'active' => true]);
        $this->e2 = Extra::create(['name' => 'Caixa', 'unit_price' => '1.20', 'active' => true]);
    }

    private function payload(array $over = []): array
    {
        return array_merge([
            'name' => 'Chaveiro', 'client' => 'Ana', 'quantity' => 1, 'printer_id' => $this->printer->id,
            'hours' => 3, 'minutes' => 30,
            'filaments' => [['filament_id' => $this->filament->id, 'grams' => 120]],
            'extras' => [
                ['extra_id' => $this->e1->id, 'quantity' => 1],
                ['extra_id' => $this->e2->id, 'quantity' => 1],
            ],
        ], $over);
    }

    public function test_preview_bate_com_motor(): void
    {
        $r = $this->postJson('/api/parts/preview', $this->payload())->assertOk();
        $r->assertJsonPath('snapshot.breakdown.total', '21.904500');
        $r->assertJsonPath('snapshot.breakdown.material', '14.400000');
        $r->assertJsonPath('snapshot.tariff_source', 'manual');
        $r->assertJsonPath('snapshot.printer.power_w', 170);
        $this->assertSame(0, Part::count());
    }

    public function test_aceita_virgula(): void
    {
        $p = $this->payload([
            'filaments' => [['filament_id' => $this->filament->id, 'grams' => '120,0']],
            'extras' => [['extra_id' => $this->e1->id, 'quantity' => '1,0']],
        ]);
        $this->postJson('/api/parts/preview', $p)->assertOk()
            ->assertJsonPath('snapshot.breakdown.material', '14.400000')
            ->assertJsonPath('snapshot.breakdown.extras', '0.400000');
    }

    public function test_minutos_60_invalido_422(): void
    {
        $this->postJson('/api/parts/preview', $this->payload(['minutes' => 60]))->assertStatus(422);
    }

    public function test_tempo_zero_422(): void
    {
        $this->postJson('/api/parts/preview', $this->payload(['hours' => 0, 'minutes' => 0]))->assertStatus(422);
    }

    public function test_tipo_sem_consumo_usa_maior_e_avisa(): void
    {
        $tpu = Filament::create(['name' => 'TPU', 'type' => 'TPU', 'price_per_kg' => '100', 'active' => true]);
        $p = $this->payload(['filaments' => [['filament_id' => $tpu->id, 'grams' => 50]]]);
        $r = $this->postJson('/api/parts/preview', $p)->assertOk();
        $r->assertJsonPath('snapshot.printer.power_w', 330);
        $this->assertContains('consumo_sem_tipo', $r->json('snapshot.warnings'));
    }

    public function test_salvar_e_listar(): void
    {
        $this->postJson('/api/parts', $this->payload())->assertCreated()
            ->assertJsonPath('cost_total', '21.90');
        $this->getJson('/api/parts?busca=Chav')->assertOk()
            ->assertJsonPath('0.cost_total', '21.90')
            ->assertJsonPath('0.per_unit', '21.90');
        $this->getJson('/api/parts?busca=zzz')->assertOk()->assertJsonCount(0);
        $id = Part::first()->id;
        $this->getJson("/api/parts/$id")->assertOk()
            ->assertJsonPath('snapshot.breakdown.total', '21.904500')
            ->assertJsonCount(1, 'part_filaments')->assertJsonCount(2, 'part_extras');
    }

    public function test_editar_substitui_linhas(): void
    {
        $id = $this->postJson('/api/parts', $this->payload())->json('id');
        $this->putJson("/api/parts/$id", $this->payload(['extras' => [['extra_id' => $this->e1->id, 'quantity' => 2]]]))
            ->assertOk();
        $this->assertSame(1, Part::find($id)->partExtras()->count());
        $this->assertSame('21.10', Part::find($id)->cost_total);
        $this->deleteJson("/api/parts/$id")->assertNoContent();
        $this->assertSame(0, Part::count());
    }

    public function test_recalcular_nao_grava_e_aplicar_grava(): void
    {
        $id = $this->postJson('/api/parts', $this->payload())->json('id');
        $this->filament->update(['price_per_kg' => '150']);

        $r = $this->postJson("/api/parts/$id/recalcular")->assertOk();
        $r->assertJsonPath('compare.breakdown.material.old', '14.400000');
        $r->assertJsonPath('compare.breakdown.material.new', '18.000000');
        $r->assertJsonPath('compare.breakdown.material.diff', '3.600000');
        $r->assertJsonPath('compare.breakdown.material.diff_pct', '25.00');
        $this->assertSame('21.90', Part::find($id)->cost_total);

        $this->postJson("/api/parts/$id/recalcular/aplicar")->assertOk();
        $this->assertSame('25.50', Part::find($id)->cost_total);
    }

    public function test_recalcular_com_filamento_desativado(): void
    {
        $id = $this->postJson('/api/parts', $this->payload())->json('id');
        $this->filament->update(['active' => false]);
        $r = $this->postJson("/api/parts/$id/recalcular")->assertOk();
        $r->assertJsonPath('snapshot.filaments.0.active', false);
        $r->assertJsonPath('compare.lines.filaments.0.active', false);
        $this->assertContains('cadastro_desativado', $r->json('snapshot.warnings'));
    }

    public function test_preview_compare_with(): void
    {
        $id = $this->postJson('/api/parts', $this->payload())->json('id');
        $this->postJson("/api/parts/preview?compare_with=$id", $this->payload(['hours' => 1]))->assertOk()
            ->assertJsonStructure(['snapshot', 'compare' => ['breakdown', 'lines', 'tariff', 'printer']]);
    }

    public function test_sem_energia_422(): void
    {
        EnergySetting::current()->update(['manual_override' => false, 'aneel_tariff_kwh' => null]);
        $this->postJson('/api/parts/preview', $this->payload())->assertStatus(422)
            ->assertJsonPath('message', 'Configure a energia primeiro');
    }
}
