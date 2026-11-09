<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Comportamento comum dos cadastros: lista so ativos (?todos=1 inclui inativos);
 * exclusao vira desativacao quando o registro ja e usado por alguma peca.
 */
abstract class CadastroController extends Controller
{
    /** @return class-string<Model> */
    abstract protected function model(): string;

    public function index(Request $request)
    {
        $q = $this->model()::query()->orderBy('name');
        if (! $request->boolean('todos')) {
            $q->where('active', true);
        }

        return $q->get();
    }

    public function show(int $id)
    {
        return $this->model()::findOrFail($id);
    }

    public function destroy(int $id): JsonResponse
    {
        $m = $this->model()::findOrFail($id);
        if ($m->isInUse()) {
            $m->update(['active' => false]);

            return response()->json(['desativado' => true]);
        }
        $m->delete();

        return response()->json(null, 204);
    }

    public function ativar(int $id)
    {
        $m = $this->model()::findOrFail($id);
        $m->update(['active' => true]);

        return $m;
    }
}
