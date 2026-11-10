import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import { brl } from '../lib/formato'
import { dataBR } from '../lib/data'
import Aviso from '../components/Aviso'
import Cartao from '../components/Cartao'

function useDebounce(valor, ms) {
  const [v, setV] = useState(valor)
  useEffect(() => {
    const t = setTimeout(() => setV(valor), ms)
    return () => clearTimeout(t)
  }, [valor, ms])
  return v
}

const CLASSE_NOVA = 'inline-flex items-center justify-center min-h-[44px] px-5 rounded-xl font-titulo font-semibold bg-laranja text-noite hover:brightness-110'

export default function PecasPage() {
  const [busca, setBusca] = useState('')
  const termo = useDebounce(busca.trim(), 300)
  const lista = useQuery({
    queryKey: ['parts', termo],
    queryFn: async () => (await api.get('/parts', { params: termo ? { busca: termo } : {} })).data,
    placeholderData: keepPreviousData,
  })

  const pecas = lista.data || []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Peças</h1>
        <Link to="/pecas/nova" className={CLASSE_NOVA}>Nova peça</Link>
      </div>
      <input
        type="search"
        aria-label="Buscar peça por nome"
        placeholder="Buscar por nome..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="w-full min-h-[44px] px-3 rounded-xl bg-noite border border-noite3 text-white focus:outline-none focus:ring-2 focus:ring-azul"
      />
      {lista.isError && <Aviso tom="erro">Não consegui carregar as peças. Tente de novo.</Aviso>}
      {lista.isPending && <p>Carregando...</p>}
      {lista.data && pecas.length === 0 && (
        termo ? <p>Nenhuma peça encontrada para "{termo}".</p> : (
          <Cartao className="text-center space-y-3">
            <p className="text-white">Nenhuma peça calculada ainda</p>
            <Link to="/pecas/nova" className={CLASSE_NOVA}>Nova peça</Link>
          </Cartao>
        )
      )}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {pecas.map((p) => (
          <li key={p.id}>
            <Link to={`/pecas/${p.id}`} className="block h-full">
              <Cartao className="h-full hover:border-azul/60 transition">
                <h2 className="text-lg font-semibold text-white break-words">{p.name}</h2>
                <p className="text-sm">{p.client || 'Sem cliente'} · {dataBR(p.calculated_at)}</p>
                <p className="font-titulo text-2xl font-bold text-laranja tabular-nums mt-2">{brl(p.cost_total)}</p>
                <p className="text-sm">
                  {p.quantity > 1 ? `${brl(p.per_unit)} por unidade · ${p.quantity} un.` : `Por unidade: ${brl(p.per_unit)}`}
                </p>
              </Cartao>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
