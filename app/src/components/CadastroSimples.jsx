import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { errosDaApi } from '../lib/erros'
import { mascaraMoeda, moedaParaInput, paraInput } from '../lib/formato'
import Aviso from './Aviso'
import Botao from './Botao'
import Campo from './Campo'
import Cartao from './Cartao'
import ConfirmarInline from './ConfirmarInline'
import Seletor from './Seletor'

const SEM_ERROS = { campos: {}, geral: '' }

// Lista + formulário para cadastros simples (filamentos, extras).
// campos: [{ nome, label, tipo?: 'texto'|'select', opcoes?, placeholder?, inputMode?, anulavel?, decimal?, moeda? }]
// moeda: campo de preço com máscara (dígitos entram pela direita: "1990" -> "19,90").
// descricao(item) devolve { titulo, detalhe }.
export default function CadastroSimples({ recurso, titulo, rotuloNovo, campos, vazio, descricao }) {
  const qc = useQueryClient()
  const [todos, setTodos] = useState(false)
  const [form, setForm] = useState(null) // null = fechado; { id?, valores }
  const [erros, setErros] = useState(SEM_ERROS)
  const [aviso, setAviso] = useState('')

  const lista = useQuery({
    queryKey: [recurso, todos],
    queryFn: async () => (await api.get(`/${recurso}`, { params: todos ? { todos: 1 } : {} })).data,
  })
  const recarregar = () => qc.invalidateQueries({ queryKey: [recurso] })

  const abrir = (item) => {
    const valores = {}
    for (const c of campos) valores[c.nome] = c.moeda ? moedaParaInput(item?.[c.nome]) : c.decimal ? paraInput(item?.[c.nome]) : item?.[c.nome] ?? (c.tipo === 'select' ? c.opcoes[0] : '')
    setErros(SEM_ERROS)
    setForm({ id: item?.id, valores })
  }

  const salvar = useMutation({
    mutationFn: () => {
      const corpo = { ...form.valores }
      for (const c of campos) if (corpo[c.nome] === '' && c.anulavel) corpo[c.nome] = null
      return form.id ? api.put(`/${recurso}/${form.id}`, corpo) : api.post(`/${recurso}`, corpo)
    },
    onSuccess: () => { setForm(null); setAviso(''); recarregar() },
    onError: (e) => setErros(errosDaApi(e, campos.map((c) => c.nome))),
  })

  const excluir = useMutation({
    mutationFn: (id) => api.delete(`/${recurso}/${id}`),
    onSuccess: (r) => {
      setAviso(r.status === 200 && r.data?.desativado ? 'Esse item já foi usado em uma peça, então foi desativado em vez de apagado.' : '')
      recarregar()
    },
    onError: (e) => setAviso(errosDaApi(e).geral || 'Não consegui excluir.'),
  })

  const reativar = useMutation({
    mutationFn: (id) => api.patch(`/${recurso}/${id}/ativar`),
    onSuccess: recarregar,
    onError: (e) => setAviso(errosDaApi(e).geral || 'Não consegui reativar.'),
  })

  const itens = lista.data || []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{titulo}</h1>
        {!form && <Botao onClick={() => abrir(null)}>{rotuloNovo}</Botao>}
      </div>

      {aviso && <Aviso tom="info">{aviso}</Aviso>}

      {form && (
        <Cartao>
          <form
            onSubmit={(ev) => { ev.preventDefault(); setErros(SEM_ERROS); salvar.mutate() }}
            className="space-y-4"
          >
            <h2 className="text-lg font-semibold">{form.id ? 'Editar' : rotuloNovo}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {campos.map((c) => {
                const comum = {
                  label: c.label,
                  value: form.valores[c.nome],
                  erro: erros.campos[c.nome],
                  onChange: (ev) => setForm({ ...form, valores: { ...form.valores, [c.nome]: c.moeda ? mascaraMoeda(ev.target.value) : ev.target.value } }),
                }
                return c.tipo === 'select'
                  ? <Seletor key={c.nome} {...comum} opcoes={c.opcoes} />
                  : <Campo key={c.nome} {...comum} placeholder={c.placeholder} inputMode={c.inputMode} />
              })}
            </div>
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
        Mostrar desativados
      </label>

      {lista.isLoading && <p>Carregando...</p>}
      {lista.isError && <Aviso tom="erro">Não consegui carregar a lista.</Aviso>}
      {lista.isSuccess && itens.length === 0 && <Cartao><p>{vazio}</p></Cartao>}

      <ul className="space-y-3">
        {itens.map((item) => {
          const d = descricao(item)
          return (
            <li key={item.id}>
              <Cartao className={`flex flex-wrap items-center justify-between gap-3 ${item.active ? '' : 'opacity-70'}`}>
                <div className="min-w-0">
                  <p className="font-semibold text-white break-words">
                    {d.titulo}
                    {!item.active && <span className="ml-2 text-xs font-normal text-moeda">desativado</span>}
                  </p>
                  <p className="text-sm">{d.detalhe}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {item.active ? (
                    <>
                      <Botao variante="secundario" onClick={() => abrir(item)}>Editar</Botao>
                      <ConfirmarInline
                        rotulo="Excluir"
                        pergunta={`Excluir "${item.name}"?`}
                        rotuloConfirmar="Sim, excluir"
                        onConfirmar={() => excluir.mutate(item.id)}
                      />
                    </>
                  ) : (
                    <Botao variante="secundario" onClick={() => reativar.mutate(item.id)}>Reativar</Botao>
                  )}
                </div>
              </Cartao>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
