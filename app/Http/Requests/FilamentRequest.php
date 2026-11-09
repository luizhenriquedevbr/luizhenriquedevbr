<?php

namespace App\Http\Requests;

use App\Support\Decimal;
use Illuminate\Foundation\Http\FormRequest;

class FilamentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $v = $this->input('price_per_kg');
        if ($this->has('price_per_kg') && (is_scalar($v) || $v === null)) {
            $this->merge(['price_per_kg' => Decimal::normalize($v)]);
        }
    }

    public function rules(): array
    {
        $req = $this->isMethod('POST') ? 'required' : 'sometimes';

        return [
            'name' => [$req, 'string', 'max:255'],
            'type' => [$req, 'in:PLA,PETG,ABS,ASA,TPU,PC'],
            'color_brand' => ['nullable', 'string', 'max:255'],
            'price_per_kg' => [$req, 'numeric', 'min:0', 'max:99999999'],
            'active' => ['sometimes', 'boolean'],
        ];
    }
}
