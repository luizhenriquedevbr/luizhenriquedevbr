import { describe, it, expect } from 'vitest'
import { brl, pct, paraNumero, paraInput, mascaraMoeda, moedaParaInput } from './formato'

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
  it('mascaraMoeda preenche da direita para a esquerda', () => {
    expect(mascaraMoeda('')).toBe('')
    expect(mascaraMoeda('1')).toBe('0,01')
    expect(mascaraMoeda('40')).toBe('0,40')
    expect(mascaraMoeda('11990')).toBe('119,90')
    expect(mascaraMoeda('1056000')).toBe('10.560,00')
    expect(mascaraMoeda('10.560,005')).toBe('105.600,05')
    expect(mascaraMoeda('0,0')).toBe('')
    expect(mascaraMoeda('123456789')).toBe('1.234.567,89')
    expect(paraNumero(mascaraMoeda('1056000'))).toBe(10560)
  })
  it('moedaParaInput formata valor da API com máscara', () => {
    expect(moedaParaInput('10560.00')).toBe('10.560,00')
    expect(moedaParaInput('0.40')).toBe('0,40')
    expect(moedaParaInput('119.9')).toBe('119,90')
    expect(moedaParaInput('0.00')).toBe('')
    expect(moedaParaInput(null)).toBe('')
  })
})
