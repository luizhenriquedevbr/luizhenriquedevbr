// Converte um erro 422 do Laravel em { campos: { campo: 'mensagem' }, geral }.
// `visiveis` lista os campos mostrados no formulário atual (prefixos valem, ex.: 'power_profiles'
// cobre 'power_profiles.PLA'). Erro de campo não visível vai para `geral`, para nunca ficar invisível.
export function errosDaApi(e, visiveis = []) {
  if (e?.response?.status !== 422) return { campos: {}, geral: 'Não consegui falar com o servidor. Tente de novo.' }
  const campos = {}
  const brutos = e.response.data?.errors || {}
  for (const [k, v] of Object.entries(brutos)) campos[k] = Array.isArray(v) ? v[0] : String(v)
  const mostrado = (k) => visiveis.some((f) => k === f || k.startsWith(`${f}.`))
  const ocultos = Object.keys(campos).filter((k) => !mostrado(k))
  const geral = ocultos.length ? campos[ocultos[0]] : Object.keys(campos).length ? '' : e.response.data?.message || ''
  return { campos, geral }
}
