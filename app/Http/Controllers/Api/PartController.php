<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PartRequest;
use App\Models\Part;
use App\Services\Cost\PartCostService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PartController extends Controller
{
    public function __construct(private PartCostService $costs)
    {
    }

    public function preview(PartRequest $request)
    {
        $snapshot = $this->costs->fromInput($request->validated());
        if ($request->query('compare_with')) {
            $old = Part::findOrFail($request->query('compare_with'));

            return ['snapshot' => $snapshot, 'compare' => $this->costs->compare($old->snapshot, $snapshot)];
        }

        return ['snapshot' => $snapshot];
    }

    public function index(Request $request)
    {
        $q = Part::query()->orderByDesc('calculated_at')->orderByDesc('id');
        if ($b = trim((string) $request->query('busca', ''))) {
            $q->where(fn ($w) => $w->where('name', 'like', "%$b%")->orWhere('client', 'like', "%$b%"));
        }

        return $q->get()->map(fn (Part $p) => [
            'id' => $p->id, 'name' => $p->name, 'client' => $p->client, 'quantity' => $p->quantity,
            'cost_total' => $p->cost_total,
            'per_unit' => PartCostService::round2((string) $p->snapshot['breakdown']['per_unit']),
            'calculated_at' => $p->calculated_at,
        ]);
    }

    public function store(PartRequest $request)
    {
        $part = DB::transaction(fn () => $this->persist(new Part(), $request->validated(), $this->costs->fromInput($request->validated())));

        return response()->json($this->full($part), 201);
    }

    public function show(int $id)
    {
        return $this->full(Part::findOrFail($id));
    }

    public function update(PartRequest $request, int $id)
    {
        $part = Part::findOrFail($id);
        $data = $request->validated();
        $snapshot = $this->costs->fromInput($data);
        DB::transaction(function () use ($part, $data, $snapshot) {
            $part->partFilaments()->delete();
            $part->partExtras()->delete();
            $this->persist($part, $data, $snapshot);
        });

        return $this->full($part);
    }

    public function destroy(int $id)
    {
        Part::findOrFail($id)->delete();

        return response()->noContent();
    }

    public function recalcular(int $id)
    {
        $part = Part::findOrFail($id);
        $new = $this->costs->fromPart($part);

        return ['snapshot' => $new, 'compare' => $this->costs->compare($part->snapshot, $new)];
    }

    public function aplicar(int $id)
    {
        $part = Part::findOrFail($id);
        $new = $this->costs->fromPart($part);
        $part->update([
            'snapshot' => $new,
            'cost_total' => PartCostService::round2($new['breakdown']['total']),
            'calculated_at' => now(),
        ]);

        return $this->full($part);
    }

    private function persist(Part $part, array $data, array $snapshot): Part
    {
        $part->fill([
            'name' => $data['name'], 'client' => $data['client'] ?? null, 'notes' => $data['notes'] ?? null,
            'quantity' => $data['quantity'], 'printer_id' => $data['printer_id'],
            'print_minutes' => (int) $data['hours'] * 60 + (int) $data['minutes'],
            'cost_total' => PartCostService::round2($snapshot['breakdown']['total']),
            'snapshot' => $snapshot, 'calculated_at' => now(),
        ])->save();
        foreach ($data['filaments'] as $l) {
            $part->partFilaments()->create(['filament_id' => $l['filament_id'], 'grams' => $l['grams']]);
        }
        foreach ($data['extras'] ?? [] as $l) {
            $part->partExtras()->create(['extra_id' => $l['extra_id'], 'quantity' => $l['quantity']]);
        }

        return $part;
    }

    private function full(Part $part): Part
    {
        return $part->refresh()->load('partFilaments', 'partExtras');
    }
}
