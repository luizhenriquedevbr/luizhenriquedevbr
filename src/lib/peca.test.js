import { describe, expect, it } from 'vitest'
import { FORM_VAZIO, formParaPayload, formValido, pecaParaForm } from './peca'

const base = {
  ...FORM_VAZIO, name: 'Chaveiro', printer_id: '1', hours: '3', minutes: '30',
  filaments: [{ filament_id: '3', grams: '120,5' }, { filament_id: '', grams: '' }],
  extras: [{ extra_id: '1', quantity: '1' }, { extra_id: '', quantity: '' }],
}

describe('peca', () => {
  it('monta o payload ignorando linhas incompletas e mantendo vírgula', () => {
    expect(formParaPayload(base)).toEqual({
      name: 'Chaveiro', quantity: 1, printer_id: 1, hours: 3, minutes: 30,
      filaments: [{ filament_id: 3, grams: '120,5' }],
      extras: [{ extra_id: 1, quantity: '1' }],
    })
  })
  it('valida', () => {
    expect(formValido(base)).toBe(true)
    expect(formValido({ ...base, name: ' ' })).toBe(false)
    expect(formValido({ ...base, hours: '0', minutes: '0' })).toBe(false)
    expect(formValido({ ...base, minutes: '60' })).toBe(false)
    expect(formValido({ ...base, printer_id: '' })).toBe(false)
    expect(formValido({ ...base, filaments: [{ filament_id: '3', grams: '0' }] })).toBe(false)
    expect(formValido({ ...base, quantity: '0' })).toBe(false)
  })
  it('carrega peça separando horas e minutos', () => {
    const f = pecaParaForm({ name: 'A', quantity: 2, printer_id: 1, print_minutes: 210, part_filaments: [{ filament_id: 3, grams: '120.00' }], part_extras: [{ extra_id: 1, quantity: '1.00' }] })
    expect(f.hours).toBe('3')
    expect(f.minutes).toBe('30')
    expect(f.filaments[0].grams).toBe('120,00')
    expect(f.extras[0].quantity).toBe('1,00')
  })
})
