import type { ComponentType } from 'react'
import { Link, NavLink, Navigate, Outlet } from 'react-router-dom'
import {
  ExternalLink,
  LayoutDashboard,
  ShieldAlert,
  Trophy,
  UserRound,
  Swords,
  Dices,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { toast } from '../lib/toast'
import logo from '../assets/logo.png'

async function signOut() {
  await supabase.auth.signOut()
  toast.info('Sesión cerrada')
}

const NAV: { to: string; label: string; icon: ComponentType<{ className?: string }>; end?: boolean }[] = [
  { to: '/admin', label: 'Resumen', icon: LayoutDashboard, end: true },
  { to: '/admin/teams', label: 'Equipos', icon: Trophy },
  { to: '/admin/players', label: 'Jugadores', icon: UserRound },
  { to: '/admin/matches', label: 'Partidos', icon: Swords },
  { to: '/admin/roulette', label: 'Ruleta', icon: Dices },
]

const linkBase = 'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors'
const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `${linkBase} ${
    isActive ? 'bg-azul-600/10 text-azul-600' : 'text-tinta-2 hover:bg-crema hover:text-tinta'
  }`

export function AdminLayout() {
  const { session, isAdmin, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-crema text-tinta-2">
        Cargando…
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/admin/login" replace />
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-crema px-4 text-center text-tinta">
        <ShieldAlert className="h-10 w-10 text-vino-500" />
        <p className="max-w-sm text-sm text-tinta-2">
          Tu cuenta ({session.user.email}) no tiene rol de administrador. Asignalo en{' '}
          <code className="text-tinta">public.profiles</code> (columna <code>role = 'ADMIN'</code>) y
          volvé a entrar.
        </p>
        <div className="flex gap-2">
          <Link
            to="/"
            className="rounded-full bg-azul-600 px-4 py-2 text-sm font-semibold text-white hover:bg-azul-500"
          >
            Volver al sitio
          </Link>
          <button
            type="button"
            onClick={() => void signOut()}
            className="rounded-full border border-linea px-4 py-2 text-sm text-tinta-2 hover:bg-panel"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-crema text-tinta sm:flex-row">
      {/* Nav mobile */}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-linea bg-panel px-4 py-2 sm:hidden">
        <Link to="/" className="flex-none" title="Ir al sitio">
          <img src={logo} alt="" className="h-6 w-6 object-contain" />
        </Link>
        <nav className="flex flex-1 gap-1 overflow-x-auto">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={navLinkClass}>
              <Icon className="h-4 w-4 flex-none" />
              {label}
            </NavLink>
          ))}
        </nav>
        <Link
          to="/"
          className="flex-none rounded-lg p-2 text-tinta-3 hover:bg-crema hover:text-tinta"
          aria-label="Ir al sitio"
          title="Ir al sitio"
        >
          <ExternalLink className="h-4 w-4" />
        </Link>
        <button
          type="button"
          onClick={() => void signOut()}
          className="flex-none rounded-lg p-2 text-tinta-3 hover:bg-crema hover:text-tinta"
          aria-label="Cerrar sesión"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      {/* Sidebar desktop */}
      <aside className="hidden w-60 flex-none flex-col gap-1 border-r border-linea bg-panel p-4 sm:flex">
        <Link to="/admin" className="mb-4 flex items-center gap-2 px-2">
          <img src={logo} alt="" className="h-6 w-6 flex-none object-contain" />
          <span className="text-sm font-bold">Panel admin</span>
        </Link>
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={navLinkClass}>
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
        <div className="mt-auto flex flex-col gap-1 border-t border-linea pt-2">
          <Link to="/" className={`${linkBase} text-tinta-2 hover:bg-crema hover:text-tinta`}>
            <ExternalLink className="h-4 w-4" />
            Ver sitio público
          </Link>
          <button
            type="button"
            onClick={() => void signOut()}
            className={`${linkBase} text-tinta-2 hover:bg-crema hover:text-tinta`}
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-4 sm:p-8">
        <Outlet />
      </main>
    </div>
  )
}
