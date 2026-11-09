<?php

namespace Tests\Feature;

use App\Models\EnergySetting;
use App\Models\User;
use App\Services\Energy\EnergyTariff;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class EnergyTest extends TestCase
{
    use RefreshDatabase;

    private const TARIFA_ID = 'fcf2906c-7c32-4b9b-a637-054e7a5234f4';

    protected function setUp(): void
    {
        parent::setUp();
        Sanctum::actingAs(User::factory()->create());
        $this->travelTo('2026-11-09 10:00:00');
    }

    private function fakeAneel(bool $tarifa = true, bool $bandeira = true): void
    {
        Http::swap(new \Illuminate\Http\Client\Factory()); // fakes anteriores têm prioridade; recomeça limpo
        Http::fake(function ($request) use ($tarifa, $bandeira) {
            $isTarifa = ($request->data()['resource_id'] ?? '') === self::TARIFA_ID;
            if ($isTarifa) {
                return $tarifa ? Http::response(['success' => true, 'result' => ['total' => 2, 'records' => [
                    ['DatInicioVigencia' => '2026-10-22', 'DatFimVigencia' => '2027-10-21', 'VlrTUSD' => '453,47', 'VlrTE' => '380,82'],
                    ['DatInicioVigencia' => '2025-10-22', 'DatFimVigencia' => '2026-10-21', 'VlrTUSD' => '400,00', 'VlrTE' => '300,00'],
                ]]]) : Http::response('erro', 500);
            }

            return $bandeira ? Http::response(['success' => true, 'result' => ['total' => 3, 'records' => [
                ['DatCompetencia' => '2015-06-01', 'NomBandeiraAcionada' => 'Vermelha P1', 'VlrAdicionalBandeira' => '55,00'],
                ['DatCompetencia' => '2026-10-01', 'NomBandeiraAcionada' => 'Verde', 'VlrAdicionalBandeira' => ',00'],
                ['DatCompetencia' => '2026-09-01', 'NomBandeiraAcionada' => 'Amarela', 'VlrAdicionalBandeira' => '18,85'],
            ]]]) : Http::response('erro', 500);
        });
    }

    public function test_get_cria_linha_com_impostos_padrao(): void
    {
        $r = $this->getJson('/api/energy')->assertOk();
        $r->assertJsonPath('setting.icms_pct', '20.00');
        $r->assertJsonPath('setting.pis_pct', '1.10');
        $r->assertJsonPath('setting.cofins_pct', '5.07');
        $r->assertJsonPath('final', null);
        $r->assertJsonPath('refresh_due', true);
    }

    public function test_refresh_com_aneel_fake(): void
    {
        $this->fakeAneel();
        $r = $this->postJson('/api/energy/refresh')->assertOk();
        $r->assertJsonPath('final.value', '1.130014');
        $r->assertJsonPath('final.source', 'aneel');
        $r->assertJsonPath('final.ref', '2026-10-22');
        $r->assertJsonPath('setting.aneel_tariff_kwh', '0.834290');
        $r->assertJsonPath('setting.flag_name', 'Verde');
        $r->assertJsonPath('refresh_due', false);
        $this->assertArrayNotHasKey('warning', $r->json());
    }

    public function test_aneel_fora_mantem_ultimo_valor(): void
    {
        $this->fakeAneel();
        $this->postJson('/api/energy/refresh')->assertOk();

        $this->fakeAneel(false, false);
        $r = $this->postJson('/api/energy/refresh')->assertOk();
        $r->assertJsonPath('warning', 'aneel_indisponivel');
        $r->assertJsonPath('final.value', '1.130014');
    }

    public function test_bandeira_fora_mantem_bandeira_anterior(): void
    {
        Http::swap(new \Illuminate\Http\Client\Factory());
        Http::fake(function ($request) {
            if (($request->data()['resource_id'] ?? '') === self::TARIFA_ID) {
                return Http::response(['success' => true, 'result' => ['records' => [
                    ['DatInicioVigencia' => '2026-10-22', 'DatFimVigencia' => '2027-10-21', 'VlrTUSD' => '453,47', 'VlrTE' => '380,82'],
                ]]]);
            }

            return Http::response(['success' => true, 'result' => ['records' => [
                ['DatCompetencia' => '2026-11-01', 'NomBandeiraAcionada' => 'Amarela', 'VlrAdicionalBandeira' => '18,85'],
            ]]]);
        });
        $this->postJson('/api/energy/refresh')->assertOk()->assertJsonPath('setting.flag_name', 'Amarela');

        $this->fakeAneel(true, false);
        $r = $this->postJson('/api/energy/refresh')->assertOk();
        $r->assertJsonPath('warning', 'aneel_bandeira_indisponivel');
        $r->assertJsonPath('setting.aneel_tariff_kwh', '0.834290');
        $r->assertJsonPath('setting.flag_name', 'Amarela');
        $r->assertJsonPath('setting.flag_add_kwh', '0.018850');
    }

    public function test_registro_malformado_nao_quebra(): void
    {
        $this->fakeAneel();
        $this->postJson('/api/energy/refresh')->assertOk();

        Http::swap(new \Illuminate\Http\Client\Factory());
        Http::fake(fn ($request) => Http::response(['success' => true, 'result' => ['records' => [
            ['DatInicioVigencia' => '2026-10-22', 'DatFimVigencia' => '2027-10-21', 'VlrTUSD' => '453,47'],
            ['DatCompetencia' => '2026-10-01', 'VlrAdicionalBandeira' => 'abc'],
        ]]]));
        $this->postJson('/api/energy/refresh')->assertOk()
            ->assertJsonPath('warning', 'aneel_indisponivel')
            ->assertJsonPath('setting.aneel_tariff_kwh', '0.834290')
            ->assertJsonPath('final.value', '1.130014');
    }

    public function test_flag_malformada_mantem_bandeira(): void
    {
        Http::swap(new \Illuminate\Http\Client\Factory());
        Http::fake(function ($request) {
            if (($request->data()['resource_id'] ?? '') === self::TARIFA_ID) {
                return Http::response(['success' => true, 'result' => ['records' => [
                    ['DatInicioVigencia' => '2026-10-22', 'DatFimVigencia' => '2027-10-21', 'VlrTUSD' => '453,47', 'VlrTE' => '380,82'],
                ]]]);
            }

            return Http::response(['success' => true, 'result' => ['records' => [
                ['DatCompetencia' => '2026-10-01', 'NomBandeiraAcionada' => 'Verde'],
            ]]]);
        });
        $this->postJson('/api/energy/refresh')->assertOk()
            ->assertJsonPath('warning', 'aneel_bandeira_indisponivel')
            ->assertJsonPath('setting.aneel_tariff_kwh', '0.834290')
            ->assertJsonPath('setting.flag_name', null);
    }

    public function test_impostos_somando_100_ou_mais_sao_recusados(): void
    {
        $this->putJson('/api/energy', ['icms_pct' => '99', 'pis_pct' => '99', 'cofins_pct' => '99'])
            ->assertStatus(422)->assertJsonValidationErrors('impostos');
        $this->putJson('/api/energy', ['icms_pct' => '99'])->assertStatus(422);
        $this->assertSame('20.00', EnergySetting::current()->icms_pct);
        $this->putJson('/api/energy', ['icms_pct' => '25'])->assertOk();
    }

    public function test_sem_registro_vigente(): void
    {
        $this->travelTo('2031-01-01');
        $this->fakeAneel();
        $this->postJson('/api/energy/refresh')->assertOk()
            ->assertJsonPath('warning', 'aneel_sem_vigente')
            ->assertJsonPath('final', null);
    }

    public function test_override_manual(): void
    {
        $r = $this->putJson('/api/energy', ['manual_override' => true, 'manual_tariff_kwh' => '1,05'])->assertOk();
        $r->assertJsonPath('final.value', '1.050000');
        $r->assertJsonPath('final.source', 'manual');
        $this->assertSame('1.050000', EnergySetting::current()->manual_tariff_kwh);
    }

    public function test_put_impostos_com_virgula_e_validacao(): void
    {
        $this->putJson('/api/energy', ['icms_pct' => '18,5'])->assertOk()->assertJsonPath('setting.icms_pct', '18.50');
        $this->putJson('/api/energy', ['icms_pct' => '150'])->assertStatus(422);
        $this->putJson('/api/energy', ['icms_pct' => ['x']])->assertStatus(422);
    }

    public function test_final_kwh_nulo_sem_tarifa(): void
    {
        $this->assertNull(app(EnergyTariff::class)->finalKwh(EnergySetting::current()));
    }
}
