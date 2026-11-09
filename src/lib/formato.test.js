import { describe, it, expect } from 'vitest'
import { brl, pct, paraNumero } from './formato'

const norm = (s) => s.replace(/ /g, ' ')

describe('formato', () => {
  it('paraNumero aceita vírgula e ponto', () => {
    expect(paraNumero('120,5')).toBe(120.5)
    expect(paraNumero('119.90')).toBe(119.9)
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
})
