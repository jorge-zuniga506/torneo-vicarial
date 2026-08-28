import { Link, NavLink, Outlet } from 'react-router-dom'
import { CalendarDays, Home, ListOrdered, Lock, Users2, Goal } from 'lucide-react'
import { useTournament } from '../hooks/useTournament'
import logo from '../assets/logo.png'

/** Lema del torneo (identidad vicarial). El nombre viene de la base (tournaments.name). */
const LEMA = 'Salmo 133.1'
const NOMBRE_FALLBACK = 'Torneo Vicarial'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive ? 'bg-azul-600/10 text-azul-600' : 'text-tinta-2 hover:text-tinta'
  }`

export function PublicLayout() {
  const { tournament, loading } = useTournament()

  return (
    <div className="flex min-h-screen flex-col bg-crema text-tinta">
      <header className="sticky top-0 z-20 border-b border-linea bg-crema/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
          <NavLink to="/" className="flex items-center gap-2.5">
            <img src={logo} alt="" className="h-9 w-9 flex-none object-contain" />
            <div className="leading-tight">
              <p className="text-sm font-bold tracking-tight text-tinta">
                {loading ? 'Cargando…' : (tournament?.name ?? NOMBRE_FALLBACK)}
              </p>
              <p className="text-[11px] font-medium text-azul-600">{LEMA}</p>
            </div>
          </NavLink>

          <nav className="ml-auto flex flex-wrap items-center gap-1">
            <NavLink to="/" end className={navLinkClass}>
              <Home className="h-4 w-4" />
              Inicio
            </NavLink>
            <NavLink to="/fixtures" className={navLinkClass}>
              <CalendarDays className="h-4 w-4" />
              Partidos
            </NavLink>
            <NavLink to="/standings" className={navLinkClass}>
              <ListOrdered className="h-4 w-4" />
              Tablas
            </NavLink>
            <NavLink to="/teams" className={navLinkClass}>
              <Users2 className="h-4 w-4" />
              Equipos
            </NavLink>
            <NavLink to="/fixtures?tab=finalizados" className={navLinkClass}>
              <Goal className="h-4 w-4" />
              Resultados
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>

      <footer className="flex flex-col items-center gap-2 border-t border-linea py-6 text-center text-xs text-tinta-3">
        <p>
          © {new Date().getFullYear()} {tournament?.name ?? NOMBRE_FALLBACK} · {LEMA} · Datos en
          vivo vía Supabase Realtime
        </p>
        <Link to="/admin" className="flex items-center gap-1 hover:text-tinta-2">
          <Lock className="h-3 w-3" />
          Panel de administración
        </Link>
      </footer>
    </div>
  )
}
