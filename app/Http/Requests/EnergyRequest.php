<?php

namespace App\Http\Requests;

use App\Support\Decimal;
use Illuminate\Foundation\Http\FormRequest;

class EnergyRequest extends FormRequest
{
    private const DECIMALS = ['icms_pct', 'pis_pct', 'cofins_pct', 'manual_tariff_kwh'];

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        foreach (self::DECIMALS as $k) {
            $v = $this->input($k);
            if ($this->has($k) && (is_scalar($v) || $v === null)) {
                $this->merge([$k => Decimal::normalize($v)]);
            }
        }
    }

    public function rules(): array
    {
        return [
            'icms_pct' => ['sometimes', 'numeric', 'min:0', 'max:99'],
            'pis_pct' => ['sometimes', 'numeric', 'min:0', 'max:99'],
            'cofins_pct' => ['sometimes', 'numeric', 'min:0', 'max:99'],
            'manual_override' => ['sometimes', 'boolean'],
            'manual_tariff_kwh' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:9999'],
        ];
    }
}
