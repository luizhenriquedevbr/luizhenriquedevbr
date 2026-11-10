import { brl } from '../lib/formato'
import AvisosCusto from './AvisosCusto'
import Cartao from './Cartao'
import PrecoVenda from './PrecoVenda'

function Linha({ rotulo, valor }) {
  return (
    <div className="flex justify-between gap-3 py-1.5">
      <dt>{rotulo}</dt>
      <dd className="text-white tabular-nums">{brl(valor)}</dd>
    </div>
  )
}

export default function PainelCusto({ snapshot, carregando, quantidade = 1 }) {
  if (!snapshot) {
    return (
      <Cartao>
        <h2 className="text-lg font-semibold mb-2">Custo</h2>
        <p className="text-sm">{carregando ? 'Calculando...' : 'Preencha impressora, tempo e filamento para ver o custo.'}</p>
      </Cartao>
    )
  }
  const b = snapshot.breakdown
  const varias = Number(quantidade) > 1
  return (
    <Cartao className={carregando ? 'opacity-70 transition' : 'transition'}>
      <h2 className="text-lg font-semibold mb-2">
        Custo {carregando && <span className="text-xs font-normal text-nevoa">atualizando...</span>}
      </h2>
      <div className="rounded-xl bg-noite p-3 mb-3">
        {varias ? (
          <>
            <p className="text-sm">Por unidade</p>
            <p className="font-titulo text-3xl font-bold text-laranja tabular-nums">{brl(b.per_unit)}</p>
            <p className="text-sm mt-1">Total de {quantidade}: <span className="text-white font-semibold tabular-nums">{brl(b.total)}</span></p>
          </>
        ) : (
          <>
            <p className="text-sm">Total</p>
            <p className="font-titulo text-3xl font-bold text-laranja tabular-nums">{brl(b.total)}</p>
          </>
        )}
      </div>
      <PrecoVenda total={b.total} porUnidade={b.per_unit} quantidade={quantidade} />
      <dl className="text-sm divide-y divide-noite3/60">
        <Linha rotulo="Material" valor={b.material} />
        <Linha rotulo="Energia" valor={b.energy} />
        <Linha rotulo="Desgaste da impressora" valor={b.wear} />
        <Linha rotulo="Extras" valor={b.extras} />
      </dl>
      <p className="mt-3 text-xs">
        Tarifa {Number(snapshot.tariff_kwh).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} R$/kWh · consumo {snapshot.printer?.power_w} W
      </p>
      <AvisosCusto avisos={snapshot.warnings} />
    </Cartao>
  )
}
