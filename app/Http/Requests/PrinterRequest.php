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
        if ($this->has('purchase_price')) {
            $this->merge(['purchase_price' => Decimal::normalize($this->input('purchase_price'))]);
        }
    }

    public function rules(): array
    {
        $req = $this->isMethod('POST') ? 'required' : 'sometimes';

        return [
            'name' => [$req, 'string', 'max:255'],
            'purchase_price' => ['nullable', 'numeric', 'min:0', 'max:99999999'],
            'lifespan_hours' => ['sometimes', 'integer', 'min:1'],
            'power_profiles' => [$req, 'array', 'min:1'],
            'power_profiles.*' => ['integer', 'between:1,2000'],
            'active' => ['sometimes', 'boolean'],
        ];
    }
}
