<?php

namespace App\Services\Energy;

use App\Models\EnergySetting;

class EnergyTariff
{
    private const S = 6;

    public function __construct(private AneelClient $client)
    {
    }

    /**
     * Consulta a ANEEL e grava. Falhas mantêm os valores salvos e devolvem aviso:
     * aneel_indisponivel (tarifa falhou), aneel_sem_vigente (sem registro vigente),
     * aneel_bandeira_indisponivel (tarifa gravada, bandeira falhou ou sem registro: mantém a anterior).
     */
    public function refresh(): array
    {
        $s = EnergySetting::current();
        $today = now()->toDateString();

        try {
            $tariff = AneelParser::currentTariff($this->client->tariffRecords(), $today);
        } catch (AneelIndisponivel) {
            return ['setting' => $s, 'warning' => 'aneel_indisponivel'];
        }
        if ($tariff === null) {
            return ['setting' => $s, 'warning' => 'aneel_sem_vigente'];
        }

        $data = [
            'aneel_tariff_kwh' => $tariff['tariff_kwh'],
            'aneel_valid_from' => $tariff['valid_from'],
            'aneel_valid_to' => $tariff['valid_to'],
            'fetched_at' => now(),
        ];
        $warning = null;
        try {
            $flag = AneelParser::currentFlag($this->client->flagRecords(), $today);
            if ($flag === null) {
                $warning = 'aneel_bandeira_indisponivel';
            } else {
                $data += [
                    'flag_name' => $flag['name'],
                    'flag_add_kwh' => $flag['add_kwh'],
                    'flag_competence' => $flag['competence'],
                ];
            }
        } catch (AneelIndisponivel) {
            $warning = 'aneel_bandeira_indisponivel';
        }

        $s->update($data);

        return ['setting' => $s->refresh(), 'warning' => $warning];
    }

    public function finalKwh(EnergySetting $s): ?array
    {
        if ($s->manual_override && $s->manual_tariff_kwh !== null) {
            return [
                'value' => bcadd((string) $s->manual_tariff_kwh, '0', self::S),
                'source' => 'manual',
                'ref' => null,
            ];
        }
        if ($s->aneel_tariff_kwh === null) {
            return null;
        }
        $pct = bcadd(bcadd((string) $s->icms_pct, (string) $s->pis_pct, 6), (string) $s->cofins_pct, 6);
        $den = bcsub('1', bcdiv($pct, '100', self::S), self::S);
        if (bccomp($den, '0', self::S) <= 0) {
            return null;
        }
        $base = bcadd((string) $s->aneel_tariff_kwh, (string) $s->flag_add_kwh, self::S);

        return [
            'value' => bcdiv($base, $den, self::S),
            'source' => 'aneel',
            'ref' => $s->aneel_valid_from?->format('Y-m-d'),
        ];
    }
}
