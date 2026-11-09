import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { errosDaApi } from '../lib/erros'
import { paraNumero } from '../lib/formato'
import Aviso from '../components/Aviso'
import Botao from '../components/Botao'
import Campo from '../components/Campo'
import Cartao from '../components/Cartao'

const AVISOS = {
  aneel_indisponivel: 'Não consegui falar com a ANEEL agora. Mantive o último valor.',
  aneel_sem_vigente: 'A ANEEL não tem tarifa vigente para hoje. Mantive o último valor.',
  aneel_bandeira_indisponivel: 'Não consegui a bandeira do mês. Mantive a anterior.',
}

const SEM_ERROS = { campos: {}, geral: '' }

function kwh(v, casas = 4) {
  const n = paraNumero(v)
  if (!Number.isFinite(n)) return '—'
  return `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })}/kWh`
}

function dataBr(iso) {
  if (!iso) return '—'
  const [a, m, d] = String(iso).slice(0, 10).split('-')
  return `${d}/${m}/${a}`
}

function dataHora(iso) {
  if (!iso) return 'nunca'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export default function EnergiaPage() {
  const qc = useQueryClient()
  const [edicao, setEdicao] = useState(null)
  const [erros, setErros] = useState(SEM_ERROS)
  const [salvo, setSalvo] = useState(false)
  const [aviso, setAviso] = useState('')
  const [erroConsulta, setErroConsulta] = useState('')
  const automatica = useRef(false)

  const energia = useQuery({
    queryKey: ['energy'],
    queryFn: async () => (await api.get('/energy')).data,
  })
  const dados = energia.data
  const setting = dados?.setting

  // Formulário derivado dos dados; vira edição local assim que o usuário digita.
  const inicial = setting && {
    icms_pct: String(setting.icms_pct ?? ''),
    pis_pct: String(setting.pis_pct ?? ''),
    cofins_pct: String(setting.cofins_pct ?? ''),
    manual_override: !!setting.manual_override,
    manual_tariff_kwh: setting.manual_tariff_kwh != null ? String(Number(setting.manual_tariff_kwh)) : '',
  }
  const form = edicao ?? inicial

  const consultar = useMutation({
    mutationFn: async () => (await api.post('/energy/refresh', null, { timeout: 120000 })).data,
    onMutate: () => { setErroConsulta(''); setAviso('') },
    onSuccess: (d) => {
      qc.setQueryData(['energy'], d)
      setAviso(d.warning ? AVISOS[d.warning] || '' : '')
    },
    onError: () => setErroConsulta('A consulta demorou demais ou falhou. Tente de novo em instantes.'),
  })

  // Consulta automática ao abrir, uma vez por visita.
  useEffect(() => {
    if (dados?.refresh_due && !automatica.current) {
      automatica.current = true
      consultar.mutate()
    }
  }, [dados, consultar])

  const salvar = useMutation({
    mutationFn: () => api.put('/energy', {
      icms_pct: form.icms_pct,
      pis_pct: form.pis_pct,
      cofins_pct: form.cofins_pct,
      manual_override: form.manual_override,
      manual_tariff_kwh: form.manual_tariff_kwh === '' ? null : form.manual_tariff_kwh,
    }),
    onSuccess: (r) => {
      qc.setQueryData(['energy'], r.data)
      setSalvo(true)
    },
    onError: (e) => setErros(errosDaApi(e)),
  })

  const mudar = (campo, valor) => { setSalvo(false); setEdicao({ ...form, [campo]: valor }) }

  if (energia.isLoading || !form) {
    return (
      <div>
        <h1 className="text-2xl font-semibold mb-4">Energia</h1>
        {energia.isError ? <Aviso tom="erro">Não consegui carregar a tarifa.</Aviso> : <p>Carregando...</p>}
      </div>
    )
  }

  const final = dados.final
  const erroImpostos = erros.campos.impostos

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Energia</h1>

      <Cartao className="border-laranja/60">
        <p className="text-sm">Tarifa final usada nos cálculos</p>
        <p className="font-titulo text-4xl font-semibold text-laranja mt-1">
          {final ? kwh(final.value) : 'Sem tarifa'}
        </p>
        <p className="text-sm mt-1">
          {final
            ? final.source === 'manual' ? 'Valor manual' : `ANEEL, referência ${dataBr(final.ref)}`
            : 'Consulte a ANEEL ou informe um valor manual.'}
        </p>
      </Cartao>

      {consultar.isPending && (
        <Aviso tom="info">Consultando a ANEEL... pode levar mais de um minuto. Você pode continuar usando a página.</Aviso>
      )}
      {erroConsulta && <Aviso tom="erro">{erroConsulta}</Aviso>}
      {aviso && <Aviso tom="alerta">{aviso}</Aviso>}

      <Cartao className="space-y-3">
        <h2 className="text-lg font-semibold">Dados da ANEEL</h2>
        <dl className="grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <dt>Tarifa sem impostos</dt>
            <dd className="text-white font-medium">{setting.aneel_tariff_kwh != null ? kwh(setting.aneel_tariff_kwh, 6) : '—'}</dd>
          </div>
          <div>
            <dt>Vigência</dt>
            <dd className="text-white font-medium">{dataBr(setting.aneel_valid_from)} a {dataBr(setting.aneel_valid_to)}</dd>
          </div>
          <div>
            <dt>Bandeira do mês</dt>
            <dd className="text-white font-medium">
              {setting.flag_name ? `${setting.flag_name} (+ ${kwh(setting.flag_add_kwh, 6)})` : '—'}
            </dd>
          </div>
          <div>
            <dt>Última consulta</dt>
            <dd className="text-white font-medium">{dataHora(setting.fetched_at)}</dd>
          </div>
        </dl>
        <Botao variante="secundario" onClick={() => consultar.mutate()} carregando={consultar.isPending}>
          Consultar ANEEL agora
        </Botao>
      </Cartao>

      <Cartao>
        <form
          onSubmit={(ev) => { ev.preventDefault(); setErros(SEM_ERROS); setSalvo(false); salvar.mutate() }}
          className="space-y-4"
        >
          <h2 className="text-lg font-semibold">Impostos e valor manual</h2>
          <p className="text-sm">Confira na sua conta de luz: as alíquotas variam de acordo com o consumo e a distribuidora.</p>

          <div className="grid gap-4 grid-cols-3">
            <Campo label="ICMS (%)" inputMode="decimal" value={form.icms_pct} erro={erros.campos.icms_pct} onChange={(e) => mudar('icms_pct', e.target.value)} />
            <Campo label="PIS (%)" inputMode="decimal" value={form.pis_pct} erro={erros.campos.pis_pct} onChange={(e) => mudar('pis_pct', e.target.value)} />
            <Campo label="COFINS (%)" inputMode="decimal" value={form.cofins_pct} erro={erros.campos.cofins_pct} onChange={(e) => mudar('cofins_pct', e.target.value)} />
          </div>
          {erroImpostos && <p className="text-sm text-red-300">{erroImpostos}</p>}

          <label className="flex items-center gap-2 min-h-[44px]">
            <input type="checkbox" className="w-5 h-5 accent-laranja" checked={form.manual_override} onChange={(e) => mudar('manual_override', e.target.checked)} />
            Usar valor manual
          </label>
          {form.manual_override && (
            <Campo
              label="Tarifa final manual (R$/kWh)"
              inputMode="decimal"
              placeholder="1,13"
              value={form.manual_tariff_kwh}
              erro={erros.campos.manual_tariff_kwh}
              onChange={(e) => mudar('manual_tariff_kwh', e.target.value)}
            />
          )}

          {erros.geral && <Aviso tom="erro">{erros.geral}</Aviso>}
          {salvo && <Aviso tom="sucesso">Salvo.</Aviso>}
          <Botao type="submit" carregando={salvar.isPending}>Salvar</Botao>
        </form>
      </Cartao>
    </div>
  )
}
