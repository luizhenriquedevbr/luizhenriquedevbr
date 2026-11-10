<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\EnergyRequest;
use App\Models\EnergySetting;
use App\Services\Energy\EnergyTariff;

class EnergyController extends Controller
{
    public function __construct(private EnergyTariff $energy)
    {
    }

    public function show()
    {
        return $this->payload(EnergySetting::current());
    }

    public function update(EnergyRequest $request)
    {
        $s = EnergySetting::current();
        $s->update($request->validated());

        return $this->payload($s->refresh());
    }

    public function refresh()
    {
        $r = $this->energy->refresh();

        return $this->payload($r['setting'], $r['warning']);
    }

    private function payload(EnergySetting $s, ?string $warning = null)
    {
        $out = [
            'setting' => $s,
            'final' => $this->energy->finalKwh($s),
            'refresh_due' => $s->fetched_at === null || $s->fetched_at->lt(now()->subDay()),
        ];
        if ($warning) {
            $out['warning'] = $warning;
        }

        return response()->json($out);
    }
}
