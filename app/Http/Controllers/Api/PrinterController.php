<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\PrinterRequest;
use App\Models\Printer;

class PrinterController extends CadastroController
{
    protected function model(): string
    {
        return Printer::class;
    }

    public function store(PrinterRequest $request)
    {
        return response()->json(Printer::create($request->validated())->refresh(), 201);
    }

    public function update(PrinterRequest $request, int $id)
    {
        $m = Printer::findOrFail($id);
        $m->update($request->validated());

        return $m->refresh();
    }
}
