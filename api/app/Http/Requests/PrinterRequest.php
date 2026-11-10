<?php

namespace App\Http\Requests;

use App\Support\Decimal;
use Illuminate\Foundation\Http\FormRequest;

class PrinterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $v = $this->input('purchase_price');
        if ($this->has('purchase_price') && (is_scalar($v) || $v === null)) {
            $norm = Decimal::normalize($v);
            if ($norm === null) {
                // vazio: nao envia ao model (create usa o default 0, update mantem o valor)
                $this->request->remove('purchase_price');
                $this->json()->remove('purchase_price');
            } else {
                $this->merge(['purchase_price' => $norm]);
            }
        }
    }

    public function messages(): array
    {
        return ['purchase_price.decimal' => 'Use vírgula para centavos, sem ponto de milhar (ex.: 15000,00).'];
    }

    public function rules(): array
    {
        $req = $this->isMethod('POST') ? 'required' : 'sometimes';

        return [
            'name' => [$req, 'string', 'max:255'],
            'purchase_price' => ['sometimes', 'numeric', 'decimal:0,2', 'min:0', 'max:99999999'],
            'lifespan_hours' => ['sometimes', 'integer', 'min:1'],
            'power_profiles' => [$req, 'array', 'min:1', function ($attr, $value, $fail) {
                $tipos = ['PLA', 'PETG', 'ABS', 'ASA', 'TPU', 'PC'];
                foreach ((array) $value as $k => $v) {
                    if (! is_string($k) || ! in_array($k, $tipos, true)) {
                        return $fail('O perfil de potencia deve ser um objeto com chaves entre ' . implode(', ', $tipos) . '.');
                    }
                    if (! is_int($v) || $v < 1 || $v > 2000) {
                        return $fail("A potencia de {$k} deve ser um inteiro entre 1 e 2000.");
                    }
                }
            }],
            'active' => ['sometimes', 'boolean'],
        ];
    }
}
