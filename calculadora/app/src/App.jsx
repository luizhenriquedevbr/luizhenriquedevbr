import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import AppLayout from './layouts/AppLayout'
import LoginPage from './pages/LoginPage'
import PecasPage from './pages/PecasPage'
import PecaPage from './pages/PecaPage'
import ImpressorasPage from './pages/ImpressorasPage'
import FilamentosPage from './pages/FilamentosPage'
import ExtrasPage from './pages/ExtrasPage'
import EnergiaPage from './pages/EnergiaPage'
import PecaFormPage from './pages/PecaFormPage'
import CadastrosPage from './pages/CadastrosPage'

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
        <Route index element={<PecasPage />} />
        <Route path="pecas" element={<PecasPage />} />
        <Route path="pecas/:id" element={<PecaPage />} />
        <Route path="pecas/nova" element={<PecaFormPage modo="nova" />} />
        <Route path="pecas/:id/editar" element={<PecaFormPage key="e" modo="editar" />} />
        <Route path="pecas/:id/duplicar" element={<PecaFormPage key="d" modo="duplicar" />} />
        <Route path="cadastros" element={<CadastrosPage />} />
        <Route path="impressoras" element={<ImpressorasPage />} />
        <Route path="filamentos" element={<FilamentosPage />} />
        <Route path="extras" element={<ExtrasPage />} />
        <Route path="energia" element={<EnergiaPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
