<?php

namespace App\Services\Cost;

/**
 * Motor de cálculo de custo (puro, sem banco). bcmath escala 6.
 * Multiplica antes de dividir para não perder precisão (ex.: 7 min).
 */
class CostCalculator
{
    private const S = 6;

    public function calculate(array $in): array
    {
        $minutes = (string) ($in['print_minutes'] ?? 0);
        $quantity = max(1, (int) ($in['quantity'] ?? 1));

        $filamentCosts = [];
        $material = $this->fmt('0');
        foreach ($in['filaments'] ?? [] as $f) {
            $cost = bcdiv(bcmul((string) $f['grams'], (string) $f['price_per_kg'], 12), '1000', self::S);
            $filamentCosts[] = $cost;
            $material = bcadd($material, $cost, self::S);
        }

        $energy = bcdiv(
            bcmul(bcmul((string) $in['power_w'], $minutes, 12), (string) $in['tariff_kwh'], 12),
            '60000',
            self::S
        );

        $lifespan = (string) ($in['lifespan_hours'] ?? 0);
        $wear = bccomp($lifespan, '0', self::S) > 0
            ? bcdiv(bcmul((string) $in['printer_price'], $minutes, 12), bcmul($lifespan, '60', 12), self::S)
            : $this->fmt('0');

        $extraCosts = [];
        $extras = $this->fmt('0');
        foreach ($in['extras'] ?? [] as $e) {
            $cost = bcmul((string) $e['unit_price'], (string) $e['quantity'], self::S);
            $extraCosts[] = $cost;
            $extras = bcadd($extras, $cost, self::S);
        }

        $total = bcadd(bcadd($material, $energy, self::S), bcadd($wear, $extras, self::S), self::S);

        return [
            'material' => $material,
            'energy' => $energy,
            'wear' => $wear,
            'extras' => $extras,
            'total' => $total,
            'per_unit' => bcdiv($total, (string) $quantity, self::S),
            'filament_costs' => $filamentCosts,
            'extra_costs' => $extraCosts,
        ];
    }

    private function fmt(string $v): string
    {
        return bcadd($v, '0', self::S);
    }
}
