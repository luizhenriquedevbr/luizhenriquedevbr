<?php

namespace Tests\Unit;

use App\Services\Energy\AneelParser;
use PHPUnit\Framework\TestCase;

class AneelParserTest extends TestCase
{
    public function test_decimal(): void
    {
        $this->assertSame('453.47', AneelParser::decimal('453,47'));
        $this->assertSame('0.00', AneelParser::decimal(',00'));
        $this->assertSame('1234.5', AneelParser::decimal('1.234,5'));
    }

    private function tarifas(): array
    {
        $base = [
            'SigAgente' => 'Neoenergia Brasília', 'DscSubGrupo' => 'B1', 'DscClasse' => 'Residencial',
            'DscUnidadeTerciaria' => 'MWh',
        ];

        return [
            $base + ['DatInicioVigencia' => '2025-10-22', 'DatFimVigencia' => '2026-10-21', 'VlrTUSD' => '400,00', 'VlrTE' => '300,00'],
            $base + ['DatInicioVigencia' => '2026-10-22', 'DatFimVigencia' => '2027-10-21', 'VlrTUSD' => '453,47', 'VlrTE' => '380,82'],
            $base + ['DatInicioVigencia' => '2026-10-22', 'DatFimVigencia' => '2027-10-21', 'VlrTUSD' => '453,47', 'VlrTE' => '380,82'],
        ];
    }

    public function test_tarifa_vigente(): void
    {
        $t = AneelParser::currentTariff($this->tarifas(), '2026-11-09');
        $this->assertSame('0.834290', $t['tariff_kwh']);
        $this->assertSame('2026-10-22', $t['valid_from']);
        $this->assertSame('2027-10-21', $t['valid_to']);
    }

    public function test_tarifa_sem_vigente(): void
    {
        $this->assertNull(AneelParser::currentTariff($this->tarifas(), '2030-01-01'));
        $this->assertNull(AneelParser::currentTariff([], '2026-11-09'));
    }

    public function test_bandeira_fora_de_ordem(): void
    {
        $recs = [
            ['DatCompetencia' => '2015-06-01', 'NomBandeiraAcionada' => 'Vermelha P1', 'VlrAdicionalBandeira' => '55,00'],
            ['DatCompetencia' => '2026-10-01', 'NomBandeiraAcionada' => 'Verde', 'VlrAdicionalBandeira' => ',00'],
            ['DatCompetencia' => '2026-09-01', 'NomBandeiraAcionada' => 'Amarela', 'VlrAdicionalBandeira' => '18,85'],
        ];
        $f = AneelParser::currentFlag($recs, '2026-11-09');
        $this->assertSame('Verde', $f['name']);
        $this->assertSame('0.000000', $f['add_kwh']);
        $this->assertSame('2026-10-01', $f['competence']);

        $f = AneelParser::currentFlag($recs, '2026-09-30');
        $this->assertSame('Amarela', $f['name']);
        $this->assertSame('0.018850', $f['add_kwh']);
    }
}
