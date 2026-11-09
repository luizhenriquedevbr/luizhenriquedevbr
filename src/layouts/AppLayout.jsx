import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Botao from '../components/Botao'

const menu = [
  { para: '/', rotulo: 'Peças', fim: true },
  { para: '/pecas/nova', rotulo: 'Nova peça' },
  { para: '/impressoras', rotulo: 'Impressoras' },
  { para: '/filamentos', rotulo: 'Filamentos' },
  { para: '/extras', rotulo: 'Extras' },
  { para: '/energia', rotulo: 'Energia' },
]

const classeLink = ({ isActive }) =>
  `flex items-center justify-center text-center min-h-[44px] px-3 rounded-xl text-sm font-medium transition ${
    isActive ? 'bg-laranja text-noite' : 'text-nevoa hover:bg-noite3'
  }`

const classeAba = ({ isActive }) =>
  `flex items-center justify-center text-center min-h-[48px] px-0.5 rounded-lg text-[11px] leading-tight font-medium ${
    isActive ? 'bg-laranja text-noite' : 'text-nevoa'
  }`

export default function AppLayout() {
  const { sair } = useAuth()

  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden md:flex md:flex-col md:w-60 md:shrink-0 md:h-screen md:sticky md:top-0 bg-noite2 border-r border-noite3/60 p-4 gap-4">
        <img src="/logo-horizontal-fundo-escuro.svg" alt="Miguel Maker" className="w-44" />
        <nav className="flex flex-col gap-1">
          {menu.map((m) => <NavLink key={m.para} to={m.para} end={m.fim} className={classeLink}>{m.rotulo}</NavLink>)}
        </nav>
        <Botao variante="fantasma" onClick={sair} className="mt-auto">Sair</Botao>
      </aside>

      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-noite2 border-b border-noite3/60">
        <img src="/logo-horizontal-fundo-escuro.svg" alt="Miguel Maker" className="h-9" />
        <Botao variante="fantasma" onClick={sair}>Sair</Botao>
      </header>

      <main className="flex-1 min-w-0 p-4 md:p-8 pb-28 md:pb-8 max-w-4xl w-full">
        <Outlet />
      </main>

      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-noite2 border-t border-noite3 grid grid-cols-6 gap-1 p-1.5">
        {menu.map((m) => <NavLink key={m.para} to={m.para} end={m.fim} className={classeAba}>{m.rotulo}</NavLink>)}
      </nav>
    </div>
  )
}
