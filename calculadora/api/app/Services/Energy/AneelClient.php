<?php

namespace App\Services\Energy;

use Illuminate\Support\Facades\Http;

class AneelClient
{
    private const URL = 'https://dadosabertos.aneel.gov.br/api/3/action/datastore_search';

    public const TARIFA_ID = 'fcf2906c-7c32-4b9b-a637-054e7a5234f4';

    public const BANDEIRA_ID = '0591b8f6-fe54-437b-b72b-1aa2efd46e42';

    public function tariffRecords(): array
    {
        return $this->get([
            'resource_id' => self::TARIFA_ID,
            'filters' => json_encode([
                'SigAgente' => 'Neoenergia Brasília',
                'DscSubGrupo' => 'B1',
                'DscModalidadeTarifaria' => 'Convencional',
                'DscBaseTarifaria' => 'Tarifa de Aplicação',
                'DscClasse' => 'Residencial',
                'DscSubClasse' => 'Residencial',
                'DscDetalhe' => 'Não se aplica',
            ], JSON_UNESCAPED_UNICODE),
            'sort' => 'DatInicioVigencia desc',
            'limit' => 20,
        ]);
    }

    public function flagRecords(): array
    {
        return $this->get([
            'resource_id' => self::BANDEIRA_ID,
            'sort' => 'DatCompetencia desc',
            'limit' => 24,
        ]);
    }

    private function get(array $query): array
    {
        try {
            $r = Http::timeout(40)->get(self::URL, $query);
        } catch (\Throwable $e) {
            throw new AneelIndisponivel($e->getMessage(), 0, $e);
        }
        if (! $r->successful() || $r->json('success') !== true) {
            throw new AneelIndisponivel('ANEEL HTTP '.$r->status());
        }

        return $r->json('result.records') ?? [];
    }
}
