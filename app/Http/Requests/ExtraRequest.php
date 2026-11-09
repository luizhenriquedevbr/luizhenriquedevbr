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

    public function rules(): array
    {
        $req = $this->isMethod('POST') ? 'required' : 'sometimes';

        return [
            'name' => [$req, 'string', 'max:255'],
            'unit_price' => [$req, 'numeric', 'min:0', 'max:99999999'],
            'active' => ['sometimes', 'boolean'],
        ];
    }
}
