import { describe, it, expect } from 'vitest'
import { brl, pct, paraNumero, paraInput } from './formato'

const norm = (s) => s.replace(/ /g, ' ')

describe('formato', () => {
  it('paraNumero aceita vírgula e ponto', () => {
    expect(paraNumero('120,5')).toBe(120.5)
    expect(paraNumero('119.90')).toBe(119.9)
    expect(paraNumero('1.234,56')).toBe(1234.56)
    expect(paraNumero('1.234.567,5')).toBe(1234567.5)
    expect(paraNumero(' 3 ')).toBe(3)
    expect(paraNumero('')).toBeNaN()
    expect(paraNumero('abc')).toBeNaN()
  })
  it('brl formata em reais', () => {
    expect(norm(brl('21.9045'))).toBe('R$ 21,90')
    expect(norm(brl(1234.5))).toBe('R$ 1.234,50')
  })
  it('pct formata percentual', () => {
    expect(pct('12.5')).toBe('12,5%')
  })
  it('paraInput converte decimal da API em texto pt-BR', () => {
    expect(paraInput('119.90')).toBe('119,90')
    expect(paraInput('20.00')).toBe('20,00')
    expect(paraInput('1.130000')).toBe('1,13')
    expect(paraInput('0.834290')).toBe('0,83429')
    expect(paraInput('15000.00')).toBe('15000,00')
    expect(paraInput(null)).toBe('')
    expect(paraInput('')).toBe('')
  })
})
