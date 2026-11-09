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
        if ($this->has('unit_price')) {
            $this->merge(['unit_price' => Decimal::normalize($this->input('unit_price'))]);
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
