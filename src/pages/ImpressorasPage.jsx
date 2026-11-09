import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { errosDaApi } from '../lib/erros'
import { brl, paraInput, paraNumero } from '../lib/formato'
import Aviso from '../components/Aviso'
import Botao from '../components/Botao'
import Campo from '../components/Campo'
import Cartao from '../components/Cartao'
import ConfirmarInline from '../components/ConfirmarInline'

const TIPOS = ['PLA', 'PETG', 'ABS', 'ASA', 'TPU', 'PC']
const SEM_ERROS = { campos: {}, geral: '' }

function valoresIniciais(p) {
  const watts = {}
  for (const t of TIPOS) watts[t] = p?.power_profiles?.[t] != null ? String(p.power_profiles[t]) : ''
  return {
    name: p?.name ?? '',
    purchase_price: paraInput(p?.purchase_price),
    lifespan_hours: p?.lifespan_hours != null ? String(p.lifespan_hours) : '10000',
    watts,
  }
}

// A API exige inteiros (não texto) em power_profiles e lifespan_hours.
function comoNumero(texto) {
  const n = paraNumero(texto)
  return Number.isFinite(n) ? n : texto
}

export default function ImpressorasPage() {
  const qc = useQueryClient()
  const [todos, setTodos] = useState(false)
  const [form, setForm] = useState(null)
  const [erros, setErros] = useState(SEM_ERROS)
  const [aviso, setAviso] = useState('')

  const lista = useQuery({
    queryKey: ['printers', todos],
    queryFn: async () => (await api.get('/printers', { params: todos ? { todos: 1 } : {} })).data,
  })
  const recarregar = () => qc.invalidateQueries({ queryKey: ['printers'] })

  const salvar = useMutation({
    mutationFn: () => {
      const v = form.valores
      const power_profiles = {}
      for (const t of TIPOS) {
        if (String(v.watts[t]).trim() !== '') power_profiles[t] = comoNumero(v.watts[t])
      }
      const corpo = {
        name: v.name,
        purchase_price: v.purchase_price,
        lifespan_hours: comoNumero(v.lifespan_hours),
        power_profiles,
      }
      return form.id ? api.put(`/printers/${form.id}`, corpo) : api.post('/printers', corpo)
    },
    onSuccess: () => { setForm(null); setAviso(''); recarregar() },
    onError: (e) => setErros(errosDaApi(e, ['name', 'purchase_price', 'lifespan_hours', 'power_profiles'])),
  })

  const excluir = useMutation({
    mutationFn: (id) => api.delete(`/printers/${id}`),
    onSuccess: (r) => {
      setAviso(r.status === 200 && r.data?.desativado ? 'Essa impressora já foi usada em uma peça, então foi desativada em vez de apagada.' : '')
      recarregar()
    },
    onError: (e) => setAviso(errosDaApi(e).geral || 'Não consegui excluir.'),
  })

  const reativar = useMutation({
    mutationFn: (id) => api.patch(`/printers/${id}/ativar`),
    onSuccess: recarregar,
    onError: (e) => setAviso(errosDaApi(e).geral || 'Não consegui reativar.'),
  })

  const abrir = (p) => {
    setErros(SEM_ERROS)
    setForm({ id: p?.id, valores: valoresIniciais(p) })
  }
  const mudar = (campo, valor) => setForm({ ...form, valores: { ...form.valores, [campo]: valor } })
  const mudarWatts = (t, valor) => mudar('watts', { ...form.valores.watts, [t]: valor })

  const itens = lista.data || []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Impressoras</h1>
        {!form && <Botao onClick={() => abrir(null)}>Nova impressora</Botao>}
      </div>

      {aviso && <Aviso tom="info">{aviso}</Aviso>}

      {form && (
        <Cartao>
          <form
            onSubmit={(ev) => { ev.preventDefault(); setErros(SEM_ERROS); salvar.mutate() }}
            className="space-y-4"
          >
            <h2 className="text-lg font-semibold">{form.id ? 'Editar impressora' : 'Nova impressora'}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo className="sm:col-span-2" label="Nome" value={form.valores.name} erro={erros.campos.name} onChange={(e) => mudar('name', e.target.value)} />
              <Campo label="Valor de compra (R$)" inputMode="decimal" placeholder="15.000,00" value={form.valores.purchase_price} erro={erros.campos.purchase_price} onChange={(e) => mudar('purchase_price', e.target.value)} />
              <Campo label="Vida útil (horas)" inputMode="numeric" value={form.valores.lifespan_hours} erro={erros.campos.lifespan_hours} onChange={(e) => mudar('lifespan_hours', e.target.value)} />
            </div>

            <fieldset>
              <legend className="text-sm font-medium text-nevoa mb-1">Consumo médio por tipo de material (W)</legend>
              <p className="text-sm mb-3">Deixe em branco o tipo que a impressora não usa.</p>
              {erros.campos.power_profiles && <p className="mb-2 text-sm text-red-300">{erros.campos.power_profiles}</p>}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {TIPOS.map((t) => (
                  <Campo
                    key={t}
                    label={`${t} (W)`}
                    inputMode="numeric"
                    value={form.valores.watts[t]}
                    erro={erros.campos[`power_profiles.${t}`]}
                    onChange={(e) => mudarWatts(t, e.target.value)}
                  />
                ))}
              </div>
            </fieldset>

            {erros.geral && <Aviso tom="erro">{erros.geral}</Aviso>}
            <div className="flex gap-2">
              <Botao type="submit" carregando={salvar.isPending}>Salvar</Botao>
              <Botao variante="fantasma" onClick={() => setForm(null)}>Cancelar</Botao>
            </div>
          </form>
        </Cartao>
      )}

      <label className="flex items-center gap-2 text-sm min-h-[44px]">
        <input type="checkbox" className="w-5 h-5 accent-laranja" checked={todos} onChange={(e) => setTodos(e.target.checked)} />
        Mostrar desativadas
      </label>

      {lista.isLoading && <p>Carregando...</p>}
      {lista.isError && <Aviso tom="erro">Não consegui carregar a lista.</Aviso>}
      {lista.isSuccess && itens.length === 0 && <Cartao><p>Nenhuma impressora cadastrada ainda.</p></Cartao>}

      <ul className="space-y-3">
        {itens.map((p) => {
          const perfis = Object.entries(p.power_profiles || {})
          return (
            <li key={p.id}>
              <Cartao className={p.active ? '' : 'opacity-70'}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-white break-words">
                      {p.name}
                      {!p.active && <span className="ml-2 text-xs font-normal text-moeda">desativada</span>}
                    </p>
                    <p className="text-sm">{brl(p.purchase_price)} · vida útil {p.lifespan_hours} h</p>
                    <p className="text-sm">
                      {perfis.length ? perfis.map(([t, w]) => `${t} ${w} W`).join(' · ') : 'Sem consumo cadastrado'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {p.active ? (
                      <>
                        <Botao variante="secundario" onClick={() => abrir(p)}>Editar</Botao>
                        <ConfirmarInline
                          rotulo="Excluir"
                          pergunta={`Excluir "${p.name}"?`}
                          rotuloConfirmar="Sim, excluir"
                          onConfirmar={() => excluir.mutate(p.id)}
                        />
                      </>
                    ) : (
                      <Botao variante="secundario" onClick={() => reativar.mutate(p.id)}>Reativar</Botao>
                    )}
                  </div>
                </div>
                {p.active && paraNumero(p.purchase_price) === 0 && (
                  <Aviso tom="alerta" className="mt-3">Informe quanto a impressora custou.</Aviso>
                )}
              </Cartao>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
