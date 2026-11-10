<?php

namespace App\Http\Requests;

use App\Support\Decimal;
use Illuminate\Foundation\Http\FormRequest;

class ExtraRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $v = $this->input('unit_price');
        if ($this->has('unit_price') && (is_scalar($v) || $v === null)) {
            $this->merge(['unit_price' => Decimal::normalize($v)]);
        }
    }

    public function messages(): array
    {
        return ['unit_price.decimal' => 'Use vírgula para centavos, sem ponto de milhar (ex.: 15000,00).'];
    }

    public function rules(): array
    {
        $req = $this->isMethod('POST') ? 'required' : 'sometimes';

        return [
            'name' => [$req, 'string', 'max:255'],
            'unit_price' => [$req, 'numeric', 'decimal:0,2', 'min:0', 'max:99999999'],
            'active' => ['sometimes', 'boolean'],
        ];
    }
}
