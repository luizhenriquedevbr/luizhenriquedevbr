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

// Só chama a prévia com o formulário completo: nome, impressora, tempo > 0 e ao menos um filamento com gramas > 0.
export function formValido(f) {
  const min = inteiro(f.minutes)
  const horas = inteiro(f.hours)
  const filamentos = f.filaments.filter((l) => l.filament_id && paraNumero(l.grams) > 0)
  return Boolean(
    f.name.trim() && f.printer_id && inteiro(f.quantity) >= 1 && min >= 0 && min <= 59 && horas >= 0 && horas * 60 + min > 0 && filamentos.length >= 1
  )
}

// Estado do formulário -> corpo da API (linhas incompletas são ignoradas; vírgula decimal vai como veio).
export function formParaPayload(f) {
  const corpo = {
    name: f.name.trim(),
    quantity: inteiro(f.quantity),
    printer_id: Number(f.printer_id),
    hours: inteiro(f.hours),
    minutes: inteiro(f.minutes),
    filaments: f.filaments
      .filter((l) => l.filament_id && paraNumero(l.grams) > 0)
      .map((l) => ({ filament_id: Number(l.filament_id), grams: String(l.grams).trim() })),
    extras: f.extras
      .filter((l) => l.extra_id && paraNumero(l.quantity) > 0)
      .map((l) => ({ extra_id: Number(l.extra_id), quantity: String(l.quantity).trim() })),
  }
  if (f.client.trim()) corpo.client = f.client.trim()
  if (f.notes.trim()) corpo.notes = f.notes.trim()
  return corpo
}
