import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import api, { lerToken, gravarToken, limparToken } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [carregando, setCarregando] = useState(() => !!lerToken())

  useEffect(() => {
    if (!lerToken()) return
    api.get('/me')
      .then((r) => setUser(r.data.user ?? r.data))
      .catch((e) => { if (e.response?.status === 401) limparToken() })
      .finally(() => setCarregando(false))
  }, [])

  const entrar = useCallback(async (email, password) => {
    const { data } = await api.post('/login', { email, password })
    gravarToken(data.token)
    setUser(data.user)
  }, [])

  const sair = useCallback(async () => {
    try { await api.post('/logout') } catch { /* token já inválido */ }
    limparToken()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, carregando, entrar, sair }}>
      {children}
    </AuthContext.Provider>
  )
}

// oxlint-disable-next-line react/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
