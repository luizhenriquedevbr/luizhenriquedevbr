const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function paraNumero(texto) {
  if (typeof texto === 'number') return texto
  let t = String(texto ?? '').trim().replace(/\s/g, '')
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.')
  if (t === '') return NaN
  return Number(t)
}

export function brl(v) {
  const n = paraNumero(v)
  return moeda.format(Number.isFinite(n) ? n : 0)
}

export function pct(v) {
  const n = paraNumero(v)
  const x = Number.isFinite(n) ? n : 0
  return `${x.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`
}

// Máscara de preço: só os dígitos contam e as 2 últimas viram centavos ("1056000" -> "10.560,00").
export function mascaraMoeda(texto) {
  const d = String(texto ?? '').replace(/\D/g, '').replace(/^0+/, '')
  if (!d) return ''
  const p = d.padStart(3, '0')
  const inteiro = p.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${inteiro},${p.slice(-2)}`
}

// Preço da API ("10560.00") -> campo com máscara ("10.560,00"); zero ou vazio abre o campo vazio.
export function moedaParaInput(v) {
  const n = paraNumero(v)
  return Number.isFinite(n) && n > 0 ? mascaraMoeda(n.toFixed(2)) : ''
}

// Decimal da API ("119.90", "1.130000") -> texto de campo pt-BR ("119,90", "1,13").
// Mantém ao menos 2 casas e tira zeros à direita além disso.
export function paraInput(v) {
  if (v === null || v === undefined || v === '') return ''
  const n = paraNumero(v)
  if (!Number.isFinite(n)) return String(v)
  const [inteiro, dec = ''] = String(v).trim().replace(',', '.').split('.')
  if (!String(v).includes('.') && !String(v).includes(',')) return inteiro
  let d = dec.replace(/0+$/, '')
  if (d.length < 2) d = d.padEnd(2, '0')
  return `${inteiro},${d}`
}
