import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { errosDaApi } from '../lib/erros'
import { FORM_VAZIO, errosDeDigitacao, formParaPayload, formValido, pecaParaForm } from '../lib/peca'
import Aviso from '../components/Aviso'
import Botao from '../components/Botao'
import Campo from '../components/Campo'
import Cartao from '../components/Cartao'
import PainelCusto from '../components/PainelCusto'
import TabelaComparacao from '../components/TabelaComparacao'

const CAMPOS = ['name', 'client', 'notes', 'quantity', 'printer_id', 'hours', 'minutes', 'filaments', 'extras']
const SEM_ERROS = { campos: {}, geral: '' }
const CLASSE_SELECT = 'w-full min-h-[44px] px-3 rounded-xl bg-noite border border-noite3 text-white focus:outline-none focus:ring-2 focus:ring-azul'

function useDebounce(valor, ms) {
  const [v, setV] = useState(valor)
  useEffect(() => {
    const t = setTimeout(() => setV(valor), ms)
    return () => clearTimeout(t)
  }, [valor, ms])
  return v
}

// Opções do select: cadastros ativos + o cadastro desativado que a peça já usa (para não sumir da tela).
function opcoesCom(ativos, usado, rotulo) {
  const lista = (ativos || []).map((o) => ({ id: String(o.id), texto: rotulo(o) }))
  if (usado && !lista.some((o) => o.id === String(usado.id))) lista.push({ id: String(usado.id), texto: `${rotulo(usado)} (desativado)` })
  return lista
}

function Escolha({ label, valor, opcoes, onChange, erro, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-nevoa mb-1.5">
        {label}
        <select aria-invalid={erro ? 'true' : undefined} className={`${CLASSE_SELECT} mt-1.5 ${erro ? 'border-red-400' : ''}`} value={valor} onChange={(e) => onChange(e.target.value)}>
          <option value="">Escolha...</option>
          {opcoes.map((o) => <option key={o.id} value={o.id}>{o.texto}</option>)}
        </select>
      </label>
      {erro && <p className="mt-1 text-sm text-red-300">{erro}</p>}
    </div>
  )
}

export default function PecaFormPage({ modo = 'nova' }) {
  const { id } = useParams()
  const carregada = useQuery({
    queryKey: ['part', id],
    queryFn: async () => (await api.get(`/parts/${id}`)).data,
    enabled: modo !== 'nova',
    staleTime: 0,
    gcTime: 0,
  })
  if (modo === 'nova') return <Formulario modo={modo} />
  if (carregada.isError) return <Aviso tom="erro">Não encontrei essa peça. <Link className="underline" to="/pecas">Voltar</Link></Aviso>
  if (!carregada.data) return <p>Carregando...</p>
  return <Formulario key={`${modo}-${id}`} modo={modo} id={id} original={carregada.data} />
}

function Formulario({ modo, id, original }) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [form, setForm] = useState(() => {
    if (!original) return FORM_VAZIO
    const f = pecaParaForm(original)
    if (modo === 'duplicar') f.name = `Cópia de ${f.name}`
    return f
  })
  const [erros, setErros] = useState(SEM_ERROS)
  const [comparacao, setComparacao] = useState(null)

  const impressoras = useQuery({ queryKey: ['printers', false], queryFn: async () => (await api.get('/printers')).data })
  const filamentos = useQuery({ queryKey: ['filaments', false], queryFn: async () => (await api.get('/filaments')).data })
  const extras = useQuery({ queryKey: ['extras', false], queryFn: async () => (await api.get('/extras')).data })

  const valido = formValido(form)
  const payload = useMemo(() => (valido ? JSON.stringify(formParaPayload(form, { previa: true })) : null), [valido, form])
  const payloadAtraso = useDebounce(payload, 400)

  // O payload faz parte da chave: resposta de digitação antiga nunca sobrescreve a atual (e a requisição velha é abortada).
  const previa = useQuery({
    queryKey: ['preview', payloadAtraso],
    queryFn: async ({ signal }) => (await api.post('/parts/preview', JSON.parse(payloadAtraso), { signal })).data,
    enabled: Boolean(payloadAtraso),
    placeholderData: keepPreviousData,
    retry: false,
    staleTime: 0,
  })

  const semEnergia = previa.error?.response?.status === 422 && /energia/i.test(previa.error.response.data?.message || '')
  const erroPrevia = previa.isError && !semEnergia ? errosDaApi(previa.error, CAMPOS) : null
  const snapshot = payload ? previa.data?.snapshot : null
  const calculando = Boolean(payload) && (payload !== payloadAtraso || previa.isFetching)

  const comparar = useMutation({
    mutationFn: async () => (await api.post(`/parts/preview?compare_with=${id}`, formParaPayload(form))).data,
    onSuccess: (d) => setComparacao(d.compare),
    onError: (e) => setErros(errosDaApi(e, CAMPOS)),
  })
  const gravar = useMutation({
    mutationFn: () => {
      const corpo = formParaPayload(form)
      return modo === 'editar' ? api.put(`/parts/${id}`, corpo) : api.post('/parts', corpo)
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['parts'] })
      qc.removeQueries({ queryKey: ['part'] })
      navigate(`/pecas/${r.data?.id ?? id}`)
    },
    onError: (e) => { setComparacao(null); setErros(errosDaApi(e, CAMPOS)) },
  })

  const mudar = (campo, valor) => { setForm({ ...form, [campo]: valor }); setComparacao(null) }
  const mudarLinha = (grupo, i, campo, valor) =>
    mudar(grupo, form[grupo].map((l, j) => (j === i ? { ...l, [campo]: valor } : l)))
  const tirarLinha = (grupo, i) => mudar(grupo, form[grupo].filter((_, j) => j !== i))
  const digitacao = errosDeDigitacao(form)
  const c = { ...digitacao, ...erros.campos }

  const aoSalvar = (ev) => {
    ev.preventDefault()
    setErros(SEM_ERROS)
    if (!valido || !form.name.trim()) {
      setErros({ campos: form.name.trim() ? {} : { name: 'Dê um nome para a peça.' }, geral: Object.keys(digitacao).length ? 'Corrija os campos marcados.' : 'Preencha nome, impressora, tempo (minutos de 0 a 59) e ao menos um filamento com gramas.' })
      return
    }
    if (modo === 'editar') comparar.mutate()
    else gravar.mutate()
  }

  const titulo = { nova: 'Nova peça', editar: 'Editar peça', duplicar: 'Duplicar peça' }[modo]
  const optImp = opcoesCom(impressoras.data, original?.snapshot?.printer, (o) => o.name)
  const usadosFil = original?.snapshot?.filaments || []
  const usadosExt = original?.snapshot?.extras || []
  const optFil = (linha) => opcoesCom(filamentos.data, usadosFil.find((u) => String(u.id) === linha.filament_id), (o) => `${o.name}${o.type ? ` (${o.type})` : ''}`)
  const optExt = (linha) => opcoesCom(extras.data, usadosExt.find((u) => String(u.id) === linha.extra_id), (o) => o.name)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{titulo}</h1>
      {modo === 'duplicar' && <Aviso tom="info">Isto é um rascunho com os valores de hoje. A peça nova só é criada quando você clicar em Salvar.</Aviso>}

      <div className="grid gap-4 lg:grid-cols-[1fr_380px] items-start">
        <form onSubmit={aoSalvar} className="space-y-4">
          <Cartao className="space-y-4">
            <Campo label="Nome da peça" value={form.name} erro={c.name} onChange={(e) => mudar('name', e.target.value)} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo label="Cliente (opcional)" value={form.client} erro={c.client} onChange={(e) => mudar('client', e.target.value)} />
              <Campo label="Quantidade" inputMode="numeric" value={form.quantity} erro={c.quantity} onChange={(e) => mudar('quantity', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-nevoa mb-1.5">
                Observação (opcional)
                <textarea rows={2} className={`${CLASSE_SELECT} mt-1.5 py-2`} value={form.notes} onChange={(e) => mudar('notes', e.target.value)} />
              </label>
              {c.notes && <p className="mt-1 text-sm text-red-300">{c.notes}</p>}
            </div>
          </Cartao>

          <Cartao className="space-y-4">
            <Escolha label="Impressora" valor={form.printer_id} opcoes={optImp} erro={c.printer_id} onChange={(v) => mudar('printer_id', v)} />
            <div className="grid grid-cols-2 gap-4">
              <Campo label="Tempo: horas" inputMode="numeric" value={form.hours} erro={c.hours} onChange={(e) => mudar('hours', e.target.value)} />
              <Campo label="Minutos (0 a 59)" inputMode="numeric" value={form.minutes} erro={c.minutes} onChange={(e) => mudar('minutes', e.target.value)} />
            </div>
          </Cartao>

          <Cartao className="space-y-3">
            <h2 className="text-lg font-semibold">Filamentos</h2>
            {c.filaments && <p className="text-sm text-red-300">{c.filaments}</p>}
            {form.filaments.map((l, i) => (
              <div key={i} className="grid grid-cols-[1fr_6.5rem_auto] gap-2 items-end">
                <Escolha label="Filamento" valor={l.filament_id} opcoes={optFil(l)} erro={c[`filaments.${i}.filament_id`]} onChange={(v) => mudarLinha('filaments', i, 'filament_id', v)} />
                <Campo label="Gramas" inputMode="decimal" value={l.grams} erro={c[`filaments.${i}.grams`]} onChange={(e) => mudarLinha('filaments', i, 'grams', e.target.value)} />
                {form.filaments.length > 1
                  ? <Botao variante="fantasma" aria-label="Tirar filamento" onClick={() => tirarLinha('filaments', i)}>Tirar</Botao>
                  : <span />}
              </div>
            ))}
            <Botao variante="secundario" onClick={() => mudar('filaments', [...form.filaments, { filament_id: '', grams: '' }])}>Adicionar filamento</Botao>
          </Cartao>

          <Cartao className="space-y-3">
            <h2 className="text-lg font-semibold">Extras</h2>
            {form.extras.length === 0 && <p className="text-sm">Argola, embalagem, ímã... (opcional)</p>}
            {form.extras.map((l, i) => (
              <div key={i} className="grid grid-cols-[1fr_6.5rem_auto] gap-2 items-end">
                <Escolha label="Extra" valor={l.extra_id} opcoes={optExt(l)} erro={c[`extras.${i}.extra_id`]} onChange={(v) => mudarLinha('extras', i, 'extra_id', v)} />
                <Campo label="Quantidade" inputMode="decimal" value={l.quantity} erro={c[`extras.${i}.quantity`]} onChange={(e) => mudarLinha('extras', i, 'quantity', e.target.value)} />
                <Botao variante="fantasma" aria-label="Tirar extra" onClick={() => tirarLinha('extras', i)}>Tirar</Botao>
              </div>
            ))}
            <Botao variante="secundario" onClick={() => mudar('extras', [...form.extras, { extra_id: '', quantity: '1' }])}>Adicionar extra</Botao>
          </Cartao>

          {erros.geral && <Aviso tom="erro">{erros.geral}</Aviso>}

          {comparacao ? (
            <Cartao className="space-y-4 border-laranja/60">
              <h2 className="text-lg font-semibold">Custo antes e agora</h2>
              <p className="text-sm">O custo foi recalculado com os valores de hoje. Nada foi gravado ainda.</p>
              <TabelaComparacao compare={comparacao} />
              <div className="flex flex-wrap gap-2">
                <Botao carregando={gravar.isPending} onClick={() => gravar.mutate()}>Confirmar e salvar</Botao>
                <Botao variante="fantasma" onClick={() => setComparacao(null)}>Cancelar</Botao>
              </div>
            </Cartao>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Botao type="submit" carregando={gravar.isPending || comparar.isPending}>Salvar</Botao>
              <Botao variante="fantasma" onClick={() => navigate(modo === 'nova' ? '/' : `/pecas/${id}`)}>Cancelar</Botao>
            </div>
          )}
        </form>

        <div className="space-y-3 lg:sticky lg:top-4">
          {semEnergia && (
            <Aviso tom="alerta">Configure a energia primeiro. <Link className="underline" to="/energia">Abrir energia</Link></Aviso>
          )}
          {erroPrevia && <Aviso tom="erro">{erroPrevia.geral || 'Confira os campos do formulário.'}</Aviso>}
          <PainelCusto snapshot={snapshot} carregando={calculando} quantidade={Number(form.quantity) || 1} />
        </div>
      </div>
    </div>
  )
}
