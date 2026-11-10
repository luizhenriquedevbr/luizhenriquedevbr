<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\FilamentRequest;
use App\Models\Filament;

class FilamentController extends CadastroController
{
    protected function model(): string
    {
        return Filament::class;
    }

    public function store(FilamentRequest $request)
    {
        return response()->json(Filament::create($request->validated())->refresh(), 201);
    }

    public function update(FilamentRequest $request, int $id)
    {
        $m = Filament::findOrFail($id);
        $m->update($request->validated());

        return $m->refresh();
    }
}
