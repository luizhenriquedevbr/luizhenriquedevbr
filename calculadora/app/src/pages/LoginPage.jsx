import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Botao from '../components/Botao'
import Campo from '../components/Campo'
import Aviso from '../components/Aviso'

export default function LoginPage() {
  const { user, entrar } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function enviar(e) {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      await entrar(email, senha)
      navigate('/', { replace: true })
    } catch (err) {
      setErro(err.response?.status === 422 || err.response?.status === 401
        ? 'E-mail ou senha incorretos'
        : 'Não consegui falar com o servidor. Tente de novo em instantes.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <img src={`${import.meta.env.BASE_URL}logo-horizontal-fundo-escuro.svg`} alt="Miguel Maker" className="w-56 max-w-full mb-8" />
      <form onSubmit={enviar} className="w-full max-w-sm bg-noite2 rounded-2xl p-6 border border-noite3/60 space-y-4">
        <h1 className="text-2xl font-semibold">Calculadora de custo</h1>
        {erro && <Aviso tom="erro">{erro}</Aviso>}
        <Campo label="E-mail" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Campo label="Senha" type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        <Botao type="submit" carregando={enviando} className="w-full">Entrar</Botao>
      </form>
    </main>
  )
}
