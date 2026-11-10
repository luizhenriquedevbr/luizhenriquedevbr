const fmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

// "2026-11-09 10:00:00", ISO ou "2026-11-09" -> "09/11/2026".
export function dataBR(v) {
  if (!v) return ''
  const t = String(v)
  const d = /^\d{4}-\d{2}-\d{2}$/.test(t) ? new Date(`${t}T12:00:00`) : new Date(t.includes('T') ? t : t.replace(' ', 'T'))
  return Number.isNaN(d.getTime()) ? '' : fmt.format(d)
}
