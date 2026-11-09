import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import AppLayout from './layouts/AppLayout'
import LoginPage from './pages/LoginPage'
import EmBreve from './pages/EmBreve'
import ImpressorasPage from './pages/ImpressorasPage'
import FilamentosPage from './pages/FilamentosPage'
import ExtrasPage from './pages/ExtrasPage'
import EnergiaPage from './pages/EnergiaPage'

function Protegida({ children }) {
  const { user, carregando } = useAuth()
  if (carregando) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Protegida><AppLayout /></Protegida>}>
        <Route index element={<EmBreve titulo="Peças" />} />
        <Route path="pecas/nova" element={<EmBreve titulo="Nova peça" />} />
        <Route path="impressoras" element={<ImpressorasPage />} />
        <Route path="filamentos" element={<FilamentosPage />} />
        <Route path="extras" element={<ExtrasPage />} />
        <Route path="energia" element={<EnergiaPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
