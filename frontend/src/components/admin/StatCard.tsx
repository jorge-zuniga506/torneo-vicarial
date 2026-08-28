import type { ComponentType, ReactNode } from 'react'
import { Link } from 'react-router-dom'

/** Tile compacto de un número. Pensado para grillas de 2-6 columnas. */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  to,
}: {
  label: string
  value: ReactNode
  hint?: string
  icon?: ComponentType<{ className?: string }>
  to?: string
}) {
  const body = (
    <div
      className={`flex h-full flex-col gap-1 rounded-xl border border-linea bg-panel p-3 ${
        to ? 'transition-colors hover:border-azul-600/40' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-1 text-[11px] font-medium text-tinta-3 uppercase">
        <span className="truncate">{label}</span>
        {Icon && <Icon className="h-3.5 w-3.5 flex-none" />}
      </div>
      <div className="text-xl font-black text-tinta tabular-nums">{value}</div>
      {hint && <p className="text-[11px] leading-tight text-tinta-2">{hint}</p>}
    </div>
  )

  return to ? (
    <Link to={to} className="block">
      {body}
    </Link>
  ) : (
    body
  )
}
