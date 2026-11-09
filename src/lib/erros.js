// Converte um erro 422 do Laravel em { campos: { campo: 'mensagem' }, geral }.
export function errosDaApi(e) {
  const campos = {}
  const brutos = e?.response?.data?.errors || {}
  for (const [k, v] of Object.entries(brutos)) campos[k] = Array.isArray(v) ? v[0] : String(v)
  const geral = e?.response?.status === 422
    ? (Object.keys(campos).length ? '' : e.response.data?.message || '')
    : 'Não consegui falar com o servidor. Tente de novo.'
  return { campos, geral }
}
