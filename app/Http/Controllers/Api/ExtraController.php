<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\ExtraRequest;
use App\Models\Extra;

class ExtraController extends CadastroController
{
    protected function model(): string
    {
        return Extra::class;
    }

    public function store(ExtraRequest $request)
    {
        return response()->json(Extra::create($request->validated())->refresh(), 201);
    }

    public function update(ExtraRequest $request, int $id)
    {
        $m = Extra::findOrFail($id);
        $m->update($request->validated());

        return $m->refresh();
    }
}
