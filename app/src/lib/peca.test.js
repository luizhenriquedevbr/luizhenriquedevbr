import { describe, expect, it } from 'vitest'
import { FORM_VAZIO, errosDeDigitacao, formParaPayload, formValido, pecaParaForm } from './peca'

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
    expect(formValido({ ...base, name: ' ' })).toBe(true)
    expect(formValido({ ...base, hours: '0', minutes: '0' })).toBe(false)
    expect(formValido({ ...base, minutes: '60' })).toBe(false)
    expect(formValido({ ...base, printer_id: '' })).toBe(false)
    expect(formValido({ ...base, filaments: [{ filament_id: '3', grams: '0' }] })).toBe(false)
    expect(formValido({ ...base, quantity: '0' })).toBe(false)
  })
  it('payload da prévia não leva nome, cliente nem observação', () => {
    const f = { ...base, name: 'Qualquer', client: 'Ana', notes: 'x' }
    const corpo = formParaPayload(f, { previa: true })
    expect(corpo.name).toBe('prévia')
    expect(corpo).not.toHaveProperty('client')
    expect(corpo).not.toHaveProperty('notes')
    expect(JSON.stringify(corpo)).toBe(JSON.stringify(formParaPayload({ ...f, name: 'Outro', client: '', notes: '' }, { previa: true })))
    expect(formParaPayload(f)).toMatchObject({ name: 'Qualquer', client: 'Ana', notes: 'x' })
  })
  it('horas aceitam até 2 casas; minutos e quantidade só inteiros', () => {
    expect(errosDeDigitacao(base)).toEqual({})
    expect(errosDeDigitacao({ ...base, hours: '3,5' })).toEqual({})
    expect(errosDeDigitacao({ ...base, hours: '3.25' })).toEqual({})
    expect(errosDeDigitacao({ ...base, hours: '3,255' }).hours).toBe('Use no máximo 2 casas depois da vírgula')
    expect(errosDeDigitacao({ ...base, hours: '3,' }).hours).toBe('Use no máximo 2 casas depois da vírgula')
    expect(errosDeDigitacao({ ...base, quantity: '1,5' }).quantity).toBe('Use um número inteiro')
    expect(errosDeDigitacao({ ...base, minutes: '30.5' }).minutes).toBe('Use um número inteiro')
    expect(formValido({ ...base, hours: '3,5', minutes: '0' })).toBe(true)
    expect(formValido({ ...base, hours: '3,255' })).toBe(false)
    expect(formValido({ ...base, quantity: '1,5' })).toBe(false)
    expect(formValido({ ...base, minutes: '', hours: '2' })).toBe(true)
    expect(formValido({ ...base, hours: '0,5', minutes: '' })).toBe(true)
  })
  it('horas quebradas viram horas e minutos no payload', () => {
    expect(formParaPayload({ ...base, hours: '3,5', minutes: '0' })).toMatchObject({ hours: 3, minutes: 30 })
    expect(formParaPayload({ ...base, hours: '3,25', minutes: '' })).toMatchObject({ hours: 3, minutes: 15 })
    expect(formParaPayload({ ...base, hours: '3,33', minutes: '0' })).toMatchObject({ hours: 3, minutes: 20 })
    expect(formParaPayload({ ...base, hours: '2,5', minutes: '45' })).toMatchObject({ hours: 3, minutes: 15 })
  })
  it('carrega peça separando horas e minutos', () => {
    const f = pecaParaForm({ name: 'A', quantity: 2, printer_id: 1, print_minutes: 210, part_filaments: [{ filament_id: 3, grams: '120.00' }], part_extras: [{ extra_id: 1, quantity: '1.00' }] })
    expect(f.hours).toBe('3')
    expect(f.minutes).toBe('30')
    expect(f.filaments[0].grams).toBe('120,00')
    expect(f.extras[0].quantity).toBe('1,00')
  })
})
