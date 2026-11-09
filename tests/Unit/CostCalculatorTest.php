<?php

namespace Tests\Unit;

use App\Services\Cost\CostCalculator;
use PHPUnit\Framework\TestCase;

class CostCalculatorTest extends TestCase
{
    private function base(array $over = []): array
    {
        return array_merge([
            'print_minutes' => 210,
            'power_w' => 170,
            'tariff_kwh' => '1.10',
            'printer_price' => '15000',
            'lifespan_hours' => 10000,
            'quantity' => 1,
            'filaments' => [['price_per_kg' => '120', 'grams' => '120']],
            'extras' => [['unit_price' => '0.40', 'quantity' => '1'], ['unit_price' => '1.20', 'quantity' => '1']],
        ], $over);
    }

    public function test_exemplo_x2d_pla(): void
    {
        $r = (new CostCalculator())->calculate($this->base());
        $this->assertSame('14.400000', $r['material']);
        $this->assertSame('0.654500', $r['energy']);
        $this->assertSame('5.250000', $r['wear']);
        $this->assertSame('1.600000', $r['extras']);
        $this->assertSame('21.904500', $r['total']);
        $this->assertSame('21.904500', $r['per_unit']);
        $this->assertSame(['14.400000'], $r['filament_costs']);
        $this->assertSame(['0.400000', '1.200000'], $r['extra_costs']);
    }

    public function test_multicolor_soma_filamentos(): void
    {
        $r = (new CostCalculator())->calculate($this->base([
            'filaments' => [['price_per_kg' => '120', 'grams' => '100'], ['price_per_kg' => '150', 'grams' => '20']],
        ]));
        $this->assertSame('15.000000', $r['material']);
        $this->assertSame(['12.000000', '3.000000'], $r['filament_costs']);
    }

    public function test_quantidade_divide(): void
    {
        $r = (new CostCalculator())->calculate($this->base(['quantity' => 4]));
        $this->assertSame('21.904500', $r['total']);
        $this->assertSame('5.476125', $r['per_unit']);
    }

    public function test_vida_util_zero_sem_desgaste(): void
    {
        $r = (new CostCalculator())->calculate($this->base(['lifespan_hours' => 0]));
        $this->assertSame('0.000000', $r['wear']);
        $this->assertSame('16.654500', $r['total']);
    }

    public function test_minutos_nao_perdem_precisao(): void
    {
        $r = (new CostCalculator())->calculate($this->base(['print_minutes' => 7, 'power_w' => 600, 'tariff_kwh' => '1', 'extras' => [], 'filaments' => []]));
        $this->assertSame('0.070000', $r['energy']);
        $this->assertSame('0.000000', $r['material']);
    }
}
