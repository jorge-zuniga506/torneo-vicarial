import type { ComponentType, ReactNode } from 'react'
import { Link } from 'react-router-dom'

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
      className={`flex h-full flex-col gap-1 rounded-2xl border border-linea bg-panel p-4 ${
        to ? 'transition-colors hover:border-azul-600/40' : ''
      }`}
    >
      <div className="flex items-center justify-between text-xs font-medium text-tinta-3 uppercase">
        {label}
        {Icon && <Icon className="h-4 w-4" />}
      </div>
      <div className="text-2xl font-black text-tinta tabular-nums">{value}</div>
      {hint && <p className="text-xs text-tinta-2">{hint}</p>}
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
