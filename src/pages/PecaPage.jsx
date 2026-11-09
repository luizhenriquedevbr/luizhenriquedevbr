import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { brl, paraInput } from '../lib/formato'
import { dataBR } from '../lib/data'
import Aviso from '../components/Aviso'
import Botao from '../components/Botao'
import Cartao from '../components/Cartao'
import ConfirmarInline from '../components/ConfirmarInline'
import TabelaComparacao from '../components/TabelaComparacao'

const AVISOS = {
  consumo_sem_tipo: 'Esse tipo de filamento não tinha consumo cadastrado nessa impressora; usei o maior valor.',
  cadastro_desativado: 'Algum cadastro usado aqui estava desativado; usei o último preço dele.',
}

const CLASSE_LINK = 'inline-flex items-center justify-center min-h-[44px] px-5 rounded-xl font-titulo font-semibold bg-azul/15 text-azul hover:bg-azul/25'
const num = (v) => paraInput(v) || '0'
const kwh = (v) => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })
const semMudanca = (c) => Object.values(c?.breakdown || {}).every((d) => Number(d.diff) === 0)

function Linha({ rotulo, valor, forte }) {
  return (
    <div className={`flex justify-between gap-3 py-1.5 ${forte ? 'font-semibold text-white' : ''}`}>
      <dt>{rotulo}</dt>
      <dd className="tabular-nums text-white">{brl(valor)}</dd>
    </div>
  )
}

function Desativado({ ativo }) {
  return ativo === false ? <span className="ml-2 text-xs text-moeda">desativado</span> : null
}

export default function PecaPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [comparacao, setComparacao] = useState(null)
  const [erro, setErro] = useState({ texto: '', energia: false })

  const peca = useQuery({
    queryKey: ['part', id],
    queryFn: async () => (await api.get(`/parts/${id}`)).data,
    retry: false,
  })

  const excluir = useMutation({
    mutationFn: () => api.delete(`/parts/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parts'] })
      qc.removeQueries({ queryKey: ['part', id] })
      navigate('/pecas')
    },
    onError: () => setErro({ texto: 'Não consegui excluir a peça. Tente de novo.', energia: false }),
  })

  const atualizar = useMutation({
    mutationFn: async () => (await api.post(`/parts/${id}/recalcular`)).data,
    onSuccess: (d) => setComparacao(d.compare),
    onError: (e) => {
      const energia = e.response?.status === 422 && /energia/i.test(e.response.data?.message || '')
      setErro({ texto: energia ? 'Configure a energia primeiro.' : 'Não consegui recalcular. Tente de novo.', energia })
    },
  })

  const aplicar = useMutation({
    mutationFn: async () => (await api.post(`/parts/${id}/recalcular/aplicar`)).data,
    onSuccess: async () => {
      setComparacao(null)
      await qc.invalidateQueries({ queryKey: ['part', id] })
      qc.invalidateQueries({ queryKey: ['parts'] })
    },
    onError: () => setErro({ texto: 'Não consegui salvar o novo custo. Tente de novo.', energia: false }),
  })

  if (peca.isError) return <Aviso tom="erro">Não encontrei essa peça. <Link className="underline" to="/pecas">Voltar para as peças</Link></Aviso>
  if (!peca.data) return <p>Carregando...</p>

  const p = peca.data
  const s = p.snapshot
  const b = s.breakdown
  const tarifaOrigem = s.tariff_source === 'manual' ? 'informada por você' : 'ANEEL'
  const igual = comparacao && semMudanca(comparacao)

  return (
    <div className="space-y-4">
      <div>
        <Link to="/pecas" className="text-sm underline">← Peças</Link>
        <h1 className="text-2xl font-semibold break-words mt-1">{p.name}</h1>
        <p className="text-sm">
          {p.client || 'Sem cliente'} · Calculado em {dataBR(p.calculated_at)} · {p.quantity} {p.quantity > 1 ? 'unidades' : 'unidade'}
        </p>
        {p.notes && <p className="text-sm mt-1 text-white">{p.notes}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Botao carregando={atualizar.isPending} onClick={() => { setErro({ texto: '', energia: false }); atualizar.mutate() }}>Atualizar valores</Botao>
        <Link to={`/pecas/${p.id}/editar`} className={CLASSE_LINK}>Editar</Link>
        <Link to={`/pecas/${p.id}/duplicar`} className={CLASSE_LINK}>Duplicar</Link>
        <ConfirmarInline rotulo="Excluir" pergunta="Excluir esta peça?" rotuloConfirmar="Sim, excluir" onConfirmar={() => excluir.mutate()} />
      </div>

      {erro.texto && (
        <Aviso tom="erro">{erro.texto} {erro.energia && <Link className="underline" to="/energia">Abrir energia</Link>}</Aviso>
      )}

      {comparacao && (
        <Cartao className="space-y-4 border-laranja/60">
          <h2 className="text-lg font-semibold">Custo antes e agora</h2>
          {igual
            ? <p className="text-sm text-white">Nada mudou desde o último cálculo.</p>
            : <p className="text-sm">Recalculei com os valores de hoje. Nada foi gravado ainda.</p>}
          <TabelaComparacao compare={comparacao} />
          <div className="flex flex-wrap gap-2">
            {!igual && <Botao carregando={aplicar.isPending} onClick={() => { setErro({ texto: '', energia: false }); aplicar.mutate() }}>Salvar novo custo</Botao>}
            <Botao variante="fantasma" onClick={() => setComparacao(null)}>{igual ? 'Fechar' : 'Manter o antigo'}</Botao>
          </div>
        </Cartao>
      )}

      <Cartao>
        <h2 className="text-lg font-semibold">Custo</h2>
        <div className="rounded-xl bg-noite p-3 my-3">
          <p className="text-sm">Total</p>
          <p className="font-titulo text-3xl font-bold text-laranja tabular-nums">{brl(b.total)}</p>
          <p className="text-sm mt-1">Por unidade: <span className="text-white font-semibold tabular-nums">{brl(b.per_unit)}</span></p>
        </div>
        <dl className="text-sm divide-y divide-noite3/60">
          <Linha rotulo="Material" valor={b.material} />
          <Linha rotulo="Energia" valor={b.energy} />
          <Linha rotulo="Desgaste da impressora" valor={b.wear} />
          <Linha rotulo="Extras" valor={b.extras} />
          <Linha rotulo="Total" valor={b.total} forte />
        </dl>
      </Cartao>

      <Cartao className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Valores usados naquele dia</h2>
          <p className="text-sm">Calculado em {dataBR(p.calculated_at)}. Mudanças de preço depois disso não alteram este custo.</p>
        </div>
        <div className="text-sm">
          <h3 className="font-medium text-nevoa">Impressora</h3>
          <p className="text-white">{s.printer.name}<Desativado ativo={s.printer.active} /></p>
          <p>Consumo {s.printer.power_w} W · tarifa {kwh(s.tariff_kwh)} R$/kWh ({tarifaOrigem}{s.tariff_ref ? `, ref. ${dataBR(s.tariff_ref)}` : ''})</p>
          <p>Preço {brl(s.printer.purchase_price)} · vida útil {s.printer.lifespan_hours} h · impressão de {Math.floor(p.print_minutes / 60)} h {p.print_minutes % 60} min</p>
        </div>
        <div className="text-sm">
          <h3 className="font-medium text-nevoa">Filamentos</h3>
          <ul className="divide-y divide-noite3/60">
            {s.filaments.map((f, i) => (
              <li key={i} className="py-1.5 flex flex-wrap justify-between gap-x-3">
                <span className="text-white">{f.name}<Desativado ativo={f.active} /></span>
                <span className="tabular-nums">{num(f.grams)} g × {brl(f.price_per_kg)}/kg = <span className="text-white">{brl(f.cost)}</span></span>
              </li>
            ))}
          </ul>
        </div>
        {s.extras.length > 0 && (
          <div className="text-sm">
            <h3 className="font-medium text-nevoa">Extras</h3>
            <ul className="divide-y divide-noite3/60">
              {s.extras.map((x, i) => (
                <li key={i} className="py-1.5 flex flex-wrap justify-between gap-x-3">
                  <span className="text-white">{x.name}<Desativado ativo={x.active} /></span>
                  <span className="tabular-nums">{num(x.quantity)} × {brl(x.unit_price)} = <span className="text-white">{brl(x.cost)}</span></span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {s.warnings?.length > 0 && (
          <div className="space-y-2">
            {s.warnings.map((w) => <Aviso key={w} tom="alerta">{AVISOS[w] || w}</Aviso>)}
          </div>
        )}
      </Cartao>
    </div>
  )
}
