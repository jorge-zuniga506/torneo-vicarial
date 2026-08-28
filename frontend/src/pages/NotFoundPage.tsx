import { Link } from 'react-router-dom'
import { CalendarDays, Home, ListOrdered, Users2 } from 'lucide-react'
import logo from '../assets/logo.png'

/** 404 de marca. Sirve tanto dentro del layout público como del admin. */
export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center gap-6 py-16 text-center sm:py-24">
      <img src={logo} alt="" className="h-14 w-14 object-contain opacity-90" />

      <div className="flex flex-col items-center gap-2">
        <p className="text-marca text-6xl font-black tracking-tight sm:text-7xl">404</p>
        <h1 className="text-xl font-bold text-tinta">Página no encontrada</h1>
        <p className="max-w-sm text-sm text-tinta-2">
          La dirección que abriste no existe o ya no está disponible.
        </p>
      </div>

      <Link
        to="/"
        className="flex items-center gap-2 rounded-full bg-azul-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-azul-500"
      >
        <Home className="h-4 w-4" />
        Volver al inicio
      </Link>

      <nav className="flex flex-wrap items-center justify-center gap-2">
        {[
          { to: '/fixtures', label: 'Partidos', icon: CalendarDays },
          { to: '/standings', label: 'Tablas', icon: ListOrdered },
          { to: '/teams', label: 'Equipos', icon: Users2 },
        ].map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-1.5 rounded-full border border-linea bg-panel px-3 py-1.5 text-xs font-medium text-tinta-2 transition-colors hover:text-tinta"
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
