<?php

namespace App\Services\Cost;

use App\Models\EnergySetting;
use App\Models\Extra;
use App\Models\Filament;
use App\Models\Part;
use App\Models\Printer;
use App\Services\Energy\EnergyTariff;
use Illuminate\Http\Exceptions\HttpResponseException;

/** Monta o snapshot de custo (valores atuais dos cadastros) e compara snapshots. */
class PartCostService
{
    private const BREAKDOWN = ['material', 'energy', 'wear', 'extras', 'total', 'per_unit'];

    public function __construct(private CostCalculator $calc, private EnergyTariff $tariff)
    {
    }

    /** Arredonda meia-para-cima em 2 casas (bcmath, sem float). */
    public static function round2(string $v): string
    {
        if (str_starts_with($v, '-')) {
            $r = bcadd(bcadd(substr($v, 1), '0.005', 6), '0', 2);

            return bccomp($r, '0', 2) === 0 ? $r : '-' . $r;
        }

        return bcadd(bcadd($v, '0.005', 6), '0', 2);
    }

    /**
     * $data: quantity, printer_id, (hours+minutes | print_minutes),
     * filaments[{filament_id,grams}], extras[{extra_id,quantity}].
     */
    public function fromInput(array $data): array
    {
        $tariff = $this->tariff->finalKwh(EnergySetting::current());
        if ($tariff === null) {
            throw new HttpResponseException(response()->json(['message' => 'Configure a energia primeiro'], 422));
        }

        $minutes = $data['print_minutes'] ?? ((int) $data['hours'] * 60 + (int) $data['minutes']);
        $printer = Printer::findOrFail($data['printer_id']);
        $warnings = [];

        $filaments = [];
        $dominant = null;
        foreach ($data['filaments'] as $line) {
            $f = Filament::findOrFail($line['filament_id']);
            $grams = bcadd((string) $line['grams'], '0', 2);
            $filaments[] = ['f' => $f, 'grams' => $grams];
            if ($dominant === null || bccomp($grams, $dominant['grams'], 2) > 0) {
                $dominant = ['type' => $f->type, 'grams' => $grams];
            }
        }

        $profiles = $printer->power_profiles ?? [];
        if (isset($profiles[$dominant['type']])) {
            $power = (int) $profiles[$dominant['type']];
        } else {
            $power = $profiles ? (int) max($profiles) : 0;
            $warnings[] = 'consumo_sem_tipo';
        }

        $extras = [];
        foreach ($data['extras'] ?? [] as $line) {
            $extras[] = ['e' => Extra::findOrFail($line['extra_id']), 'quantity' => bcadd((string) $line['quantity'], '0', 2)];
        }

        $r = $this->calc->calculate([
            'print_minutes' => $minutes,
            'power_w' => $power,
            'tariff_kwh' => $tariff['value'],
            'printer_price' => (string) $printer->purchase_price,
            'lifespan_hours' => (int) $printer->lifespan_hours,
            'quantity' => (int) $data['quantity'],
            'filaments' => array_map(fn ($l) => ['price_per_kg' => (string) $l['f']->price_per_kg, 'grams' => $l['grams']], $filaments),
            'extras' => array_map(fn ($l) => ['unit_price' => (string) $l['e']->unit_price, 'quantity' => $l['quantity']], $extras),
        ]);

        $inactive = ! $printer->active;
        $fLines = [];
        foreach ($filaments as $i => $l) {
            $inactive = $inactive || ! $l['f']->active;
            $fLines[] = [
                'id' => $l['f']->id, 'name' => $l['f']->name, 'type' => $l['f']->type,
                'price_per_kg' => (string) $l['f']->price_per_kg, 'grams' => $l['grams'],
                'cost' => $r['filament_costs'][$i], 'active' => (bool) $l['f']->active,
            ];
        }
        $eLines = [];
        foreach ($extras as $i => $l) {
            $inactive = $inactive || ! $l['e']->active;
            $eLines[] = [
                'id' => $l['e']->id, 'name' => $l['e']->name, 'unit_price' => (string) $l['e']->unit_price,
                'quantity' => $l['quantity'], 'cost' => $r['extra_costs'][$i], 'active' => (bool) $l['e']->active,
            ];
        }
        if ($inactive) {
            $warnings[] = 'cadastro_desativado';
        }

        return [
            'tariff_kwh' => $tariff['value'],
            'tariff_source' => $tariff['source'],
            'tariff_ref' => $tariff['ref'],
            'printer' => [
                'id' => $printer->id, 'name' => $printer->name, 'purchase_price' => (string) $printer->purchase_price,
                'lifespan_hours' => (int) $printer->lifespan_hours, 'power_w' => $power, 'active' => (bool) $printer->active,
            ],
            'filaments' => $fLines,
            'extras' => $eLines,
            'breakdown' => array_intersect_key($r, array_flip(self::BREAKDOWN)),
            'warnings' => $warnings,
        ];
    }

    public function fromPart(Part $p): array
    {
        $p->loadMissing('partFilaments', 'partExtras');

        return $this->fromInput([
            'quantity' => $p->quantity,
            'printer_id' => $p->printer_id,
            'print_minutes' => (int) $p->print_minutes,
            'filaments' => $p->partFilaments->map(fn ($l) => ['filament_id' => $l->filament_id, 'grams' => $l->grams])->all(),
            'extras' => $p->partExtras->map(fn ($l) => ['extra_id' => $l->extra_id, 'quantity' => $l->quantity])->all(),
        ]);
    }

    public function compare(array $old, array $new): array
    {
        $breakdown = [];
        foreach (self::BREAKDOWN as $k) {
            $o = (string) $old['breakdown'][$k];
            $n = (string) $new['breakdown'][$k];
            $diff = bcsub($n, $o, 6);
            $breakdown[$k] = [
                'old' => $o, 'new' => $n, 'diff' => $diff,
                'diff_pct' => bccomp($o, '0', 6) === 0 ? null : self::round2(bcdiv(bcmul($diff, '100', 12), $o, 6)),
            ];
        }

        $lines = function (array $oldL, array $newL, string $price) {
            $out = array_map(function ($l) use ($oldL, $price) {
                $match = collect($oldL)->firstWhere('id', $l['id']);

                return ['name' => $l['name'], 'old_price' => $match[$price] ?? null, 'new_price' => $l[$price], 'active' => $l['active']];
            }, $newL);
            $newIds = array_column($newL, 'id');
            foreach ($oldL as $l) {
                if (! in_array($l['id'], $newIds, true)) {
                    $out[] = ['name' => $l['name'], 'old_price' => $l[$price], 'new_price' => null, 'active' => $l['active']];
                }
            }

            return $out;
        };

        return [
            'breakdown' => $breakdown,
            'lines' => [
                'filaments' => $lines($old['filaments'], $new['filaments'], 'price_per_kg'),
                'extras' => $lines($old['extras'], $new['extras'], 'unit_price'),
            ],
            'tariff' => ['old' => $old['tariff_kwh'], 'new' => $new['tariff_kwh']],
            'printer' => ['old_price' => $old['printer']['purchase_price'], 'new_price' => $new['printer']['purchase_price']],
        ];
    }
}
