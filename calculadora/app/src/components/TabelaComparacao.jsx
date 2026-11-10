import { brl, pct } from '../lib/formato'

const PARCELAS = [
  ['material', 'Material'],
  ['energy', 'Energia'],
  ['wear', 'Desgaste'],
  ['extras', 'Extras'],
  ['total', 'Total'],
  ['per_unit', 'Por unidade'],
]

const tem = (v) => v !== null && v !== undefined

function Diferenca({ d }) {
  const n = Number(d.diff)
  const cor = n > 0 ? 'text-red-300' : n < 0 ? 'text-emerald-300' : 'text-nevoa'
  const sinal = n > 0 ? '+' : ''
  return (
    <span className={`tabular-nums ${cor}`}>
      {sinal}{brl(d.diff)}
      {tem(d.diff_pct) && <span className="block text-xs">{sinal}{pct(d.diff_pct)}</span>}
    </span>
  )
}

function LinhaPreco({ l }) {
  let nota = null
  if (!tem(l.old_price)) nota = <span className="ml-2 text-xs text-azul">adicionado</span>
  else if (!tem(l.new_price)) nota = <span className="ml-2 text-xs text-azul">removido</span>
  return (
    <li className="flex flex-wrap items-baseline justify-between gap-x-3 py-1.5">
      <span className="text-white break-words">
        {l.name}
        {l.active === false && <span className="ml-2 text-xs text-moeda">desativado</span>}
        {nota}
      </span>
      <span className="tabular-nums">
        {tem(l.old_price) ? brl(l.old_price) : '—'} → {tem(l.new_price) ? brl(l.new_price) : '—'}
      </span>
    </li>
  )
}

const fmtTarifa = (v) => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })

export default function TabelaComparacao({ compare }) {
  if (!compare) return null
  const { breakdown, lines, tariff, printer } = compare
  const grupos = [['Filamentos (R$/kg)', lines?.filaments], ['Extras (R$ cada)', lines?.extras]].filter(([, ls]) => ls?.length)
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-nevoa">
              <th className="py-2 pr-3 font-medium">Parcela</th>
              <th className="py-2 pr-3 font-medium text-right">Antes</th>
              <th className="py-2 pr-3 font-medium text-right">Agora</th>
              <th className="py-2 font-medium text-right">Diferença</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-noite3/60">
            {PARCELAS.map(([chave, rotulo]) => {
              const d = breakdown[chave]
              const forte = chave === 'total' || chave === 'per_unit'
              return (
                <tr key={chave} className={forte ? 'font-semibold text-white' : ''}>
                  <td className="py-2 pr-3">{rotulo}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{brl(d.old)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{brl(d.new)}</td>
                  <td className="py-2 text-right"><Diferenca d={d} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {grupos.map(([titulo, ls]) => (
        <div key={titulo}>
          <h3 className="text-sm font-medium text-nevoa">{titulo}</h3>
          <ul className="divide-y divide-noite3/60 text-sm">{ls.map((l, i) => <LinhaPreco key={`${l.name}-${i}`} l={l} />)}</ul>
        </div>
      ))}

      <p className="text-xs">
        {tariff && <>Tarifa de energia: {fmtTarifa(tariff.old)} → {fmtTarifa(tariff.new)} R$/kWh. </>}
        {printer && <>Impressora: {brl(printer.old_price)} → {brl(printer.new_price)}.</>}
      </p>
    </div>
  )
}
