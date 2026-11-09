<?php

namespace App\Http\Requests;

use App\Support\Decimal;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class PartRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'filaments' => $this->normalizeLines($this->input('filaments'), 'grams'),
            'extras' => $this->normalizeLines($this->input('extras'), 'quantity'),
        ]);
    }

    /** Normaliza só escalares (arrays ficam como estão para o `numeric` rejeitar). */
    private function normalizeLines(mixed $lines, string $field): mixed
    {
        if (! is_array($lines)) {
            return $lines;
        }
        foreach ($lines as $i => $line) {
            if (is_array($line) && array_key_exists($field, $line) && (is_scalar($line[$field]) || $line[$field] === null)) {
                $lines[$i][$field] = Decimal::normalize($line[$field]);
            }
        }

        return $lines;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'client' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'quantity' => ['required', 'integer', 'min:1'],
            'printer_id' => ['required', 'integer', 'exists:printers,id'],
            'hours' => ['required', 'integer', 'min:0'],
            'minutes' => ['required', 'integer', 'min:0', 'max:59'],
            'filaments' => ['required', 'array', 'min:1'],
            'filaments.*.filament_id' => ['required', 'integer', 'exists:filaments,id'],
            'filaments.*.grams' => ['required', 'numeric', 'decimal:0,2', 'gt:0', 'max:99999999'],
            'extras' =>['nullable', 'array'],
            'extras.*.extra_id' => ['required', 'integer', 'exists:extras,id'],
            'extras.*.quantity' => ['required', 'numeric', 'decimal:0,2', 'gt:0', 'max:99999999'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            if (! $v->errors()->has('hours') && ! $v->errors()->has('minutes')
                && (int) $this->input('hours') * 60 + (int) $this->input('minutes') <= 0) {
                $v->errors()->add('minutes', 'O tempo de impressão deve ser maior que zero.');
            }
        });
    }
}
