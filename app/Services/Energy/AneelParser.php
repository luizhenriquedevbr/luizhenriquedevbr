<?php

namespace App\Services\Energy;

/** Interpreta registros da ANEEL (valores em R$/MWh com vírgula decimal). */
final class AneelParser
{
    private const S = 6;

    public static function decimal(string $v): string
    {
        $s = trim($v);
        if (str_contains($s, ',')) {
            $s = str_replace(['.', ','], ['', '.'], $s);
        }
        if ($s === '' || $s === '.') {
            return '0.00';
        }
        if ($s[0] === '.') {
            $s = '0'.$s;
        }

        return $s;
    }

    public static function currentTariff(array $records, string $today): ?array
    {
        $best = null;
        foreach ($records as $r) {
            $from = $r['DatInicioVigencia'] ?? null;
            $to = $r['DatFimVigencia'] ?? null;
            if (! $from || ! $to || $from > $today || $to < $today) {
                continue;
            }
            if ($best === null || $from > $best['DatInicioVigencia']) {
                $best = $r;
            }
        }
        if ($best === null) {
            return null;
        }
        $mwh = bcadd(self::num($best, 'VlrTUSD'), self::num($best, 'VlrTE'), 6);

        return [
            'tariff_kwh' => bcdiv($mwh, '1000', self::S),
            'valid_from' => $best['DatInicioVigencia'],
            'valid_to' => $best['DatFimVigencia'],
        ];
    }

    public static function currentFlag(array $records, string $today): ?array
    {
        $limit = substr($today, 0, 7).'-01';
        $best = null;
        foreach ($records as $r) {
            $c = $r['DatCompetencia'] ?? null;
            if (! $c || $c > $limit) {
                continue;
            }
            if ($best === null || $c > $best['DatCompetencia']) {
                $best = $r;
            }
        }
        if ($best === null) {
            return null;
        }

        $name = $best['NomBandeiraAcionada'] ?? null;
        if (! is_string($name) || trim($name) === '') {
            throw new AneelIndisponivel('registro de bandeira malformado');
        }

        return [
            'name' => $name,
            'add_kwh' => bcdiv(self::num($best, 'VlrAdicionalBandeira'), '1000', self::S),
            'competence' => $best['DatCompetencia'],
        ];
    }

    /** Valor numérico obrigatório do registro; registro malformado conta como ANEEL indisponível. */
    private static function num(array $r, string $key): string
    {
        $v = $r[$key] ?? null;
        if (! is_string($v) && ! is_int($v) && ! is_float($v)) {
            throw new AneelIndisponivel("registro sem $key");
        }
        $d = self::decimal((string) $v);
        if (! preg_match('/^\d+(\.\d+)?$/', $d)) {
            throw new AneelIndisponivel("$key inválido");
        }

        return $d;
    }
}
