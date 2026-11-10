import { paraInput, paraNumero } from './formato'

export const FORM_VAZIO = {
  name: '', client: '', notes: '', quantity: '1', printer_id: '', hours: '0', minutes: '0',
  filaments: [{ filament_id: '', grams: '' }],
  extras: [],
}

function inteiro(t) {
  const n = paraNumero(t)
  return Number.isFinite(n) ? Math.trunc(n) : 0
}

// Peça da API -> estado do formulário (tempo separado em horas e minutos).
export function pecaParaForm(p) {
  const total = Number(p.print_minutes) || 0
  return {
    name: p.name ?? '',
    client: p.client ?? '',
    notes: p.notes ?? '',
    quantity: String(p.quantity ?? 1),
    printer_id: String(p.printer_id ?? ''),
    hours: String(Math.floor(total / 60)),
    minutes: String(total % 60),
    filaments: (p.part_filaments || []).map((l) => ({ filament_id: String(l.filament_id), grams: paraInput(l.grams) })),
    extras: (p.part_extras || []).map((l) => ({ extra_id: String(l.extra_id), quantity: paraInput(l.quantity) })),
  }
}

const ehInteiro = (t) => /^\d*$/.test(String(t ?? '').trim())
const ehHora = (t) => /^\d*([.,]\d{1,2})?$/.test(String(t ?? '').trim())

// Tempo total em minutos: horas aceitam até 2 casas ("3,5" = 3 h 30), arredondado ao minuto, mais o campo de minutos.
function totalMinutos(f) {
  const h = paraNumero(f.hours)
  const centesimos = Number.isFinite(h) ? Math.round(h * 100) : 0
  return Math.round((centesimos * 60) / 100) + inteiro(f.minutes)
}

// Erros de digitação (horas até 2 casas; minutos e quantidade só inteiros; nada é truncado em silêncio).
export function errosDeDigitacao(f) {
  const e = {}
  if (!ehHora(f.hours)) e.hours = 'Use no máximo 2 casas depois da vírgula'
  if (!ehInteiro(f.minutes)) e.minutes = 'Use um número inteiro'
  if (!ehInteiro(f.quantity)) e.quantity = 'Use um número inteiro'
  return e
}

// Só chama a prévia com o formulário completo: impressora, tempo > 0 e ao menos um filamento com gramas > 0.
// O nome não entra (só é exigido ao salvar); a prévia usa um nome de mentirinha.
export function formValido(f) {
  const min = inteiro(f.minutes)
  const filamentos = f.filaments.filter((l) => l.filament_id && paraNumero(l.grams) > 0)
  return Boolean(
    Object.keys(errosDeDigitacao(f)).length === 0 && f.printer_id && inteiro(f.quantity) >= 1 && min >= 0 && min <= 59 && totalMinutos(f) > 0 && filamentos.length >= 1
  )
}

// Estado do formulário -> corpo da API (linhas incompletas são ignoradas; vírgula decimal vai como veio).
// previa: corpo só para /parts/preview (sem nome, cliente nem observação, para não recalcular a cada tecla deles).
export function formParaPayload(f, { previa = false } = {}) {
  const corpo = {
    name: previa ? 'prévia' : f.name.trim(),
    quantity: inteiro(f.quantity),
    printer_id: Number(f.printer_id),
    hours: Math.floor(totalMinutos(f) / 60),
    minutes: totalMinutos(f) % 60,
    filaments: f.filaments
      .filter((l) => l.filament_id && paraNumero(l.grams) > 0)
      .map((l) => ({ filament_id: Number(l.filament_id), grams: String(l.grams).trim() })),
    extras: f.extras
      .filter((l) => l.extra_id && paraNumero(l.quantity) > 0)
      .map((l) => ({ extra_id: Number(l.extra_id), quantity: String(l.quantity).trim() })),
  }
  if (previa) return corpo
  if (f.client.trim()) corpo.client = f.client.trim()
  if (f.notes.trim()) corpo.notes = f.notes.trim()
  return corpo
}
