import axios from 'axios'

const CHAVE = 'mm_token'

export function lerToken() {
  try { return localStorage.getItem(CHAVE) } catch { return null }
}
export function gravarToken(t) {
  try { localStorage.setItem(CHAVE, t) } catch { /* sem armazenamento */ }
}
export function limparToken() {
  try { localStorage.removeItem(CHAVE) } catch { /* sem armazenamento */ }
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8011/api',
  headers: { Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  const t = lerToken()
  if (t) config.headers.Authorization = `Bearer ${t}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (erro) => {
    const url = erro.config?.url || ''
    if (erro.response?.status === 401 && !url.includes('/login')) {
      limparToken()
      const login = `${import.meta.env.BASE_URL}login`
      if (window.location.pathname !== login) window.location.assign(login)
    }
    return Promise.reject(erro)
  }
)

export default api
