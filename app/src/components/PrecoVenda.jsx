import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { brl, pct, precoVenda } from '../lib/formato'

// Preço sugerido = custo × (1 + lucro). O lucro vem da configuração (tela Energia), com o valor atual.
export default function PrecoVenda({ total, porUnidade, quantidade = 1 }) {
  const energia = useQuery({ queryKey: ['energy'], queryFn: async () => (await api.get('/energy')).data })
  const lucro = energia.data?.setting?.markup_pct
  const varias = Number(quantidade) > 1
  return (
    <div className="rounded-xl border border-laranja/60 p-3 mb-3">
      <p className="text-sm">
        Preço de venda {lucro != null && <>(lucro de {pct(lucro)}, <Link className="underline" to="/energia">mudar</Link>)</>}
      </p>
      <p className="font-titulo text-3xl font-bold text-white tabular-nums">{brl(precoVenda(varias ? porUnidade : total, lucro))}</p>
      {varias && <p className="text-sm mt-1">por unidade · total de {quantidade}: <span className="text-white font-semibold tabular-nums">{brl(precoVenda(total, lucro))}</span></p>}
    </div>
  )
}
