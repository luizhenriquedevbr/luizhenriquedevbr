<?php

namespace App\Http\Requests;

use App\Models\EnergySetting;
use App\Support\Decimal;
use Illuminate\Foundation\Http\FormRequest;

class EnergyRequest extends FormRequest
{
    private const DECIMALS = ['icms_pct', 'pis_pct', 'cofins_pct', 'manual_tariff_kwh', 'markup_pct'];

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
            'markup_pct' => ['sometimes', 'numeric', 'decimal:0,2', 'min:0', 'max:1000'],
        ];
    }

    public function after(): array
    {
        return [function ($validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }
            $cur = EnergySetting::current();
            $sum = '0';
            foreach (['icms_pct', 'pis_pct', 'cofins_pct'] as $k) {
                $sum = bcadd($sum, (string) $this->input($k, $cur->$k), 6);
            }
            if (bccomp($sum, '100', 6) >= 0) {
                $validator->errors()->add('impostos', 'ICMS + PIS + COFINS deve ser menor que 100%.');
            }
        }];
    }
}
