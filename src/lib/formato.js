const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function paraNumero(texto) {
  if (typeof texto === 'number') return texto
  const t = String(texto ?? '').trim().replace(/\s/g, '').replace(',', '.')
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
