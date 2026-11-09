import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import AppLayout from './layouts/AppLayout'
import LoginPage from './pages/LoginPage'
import EmBreve from './pages/EmBreve'

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
        <Route path="impressoras" element={<EmBreve titulo="Impressoras" />} />
        <Route path="filamentos" element={<EmBreve titulo="Filamentos" />} />
        <Route path="extras" element={<EmBreve titulo="Extras" />} />
        <Route path="energia" element={<EmBreve titulo="Energia" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
