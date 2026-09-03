import { Link } from 'react-router-dom'
import { TeamBadge } from './TeamBadge'
import type { StandingWithTeam } from '../types/tournament'
import type { StandingStatus } from '../utils/qualifiers'

const COLS = [
  { key: 'played', label: 'PJ', title: 'Partidos jugados' },
  { key: 'won', label: 'G', title: 'Ganados' },
  { key: 'drawn', label: 'E', title: 'Empatados' },
  { key: 'lost', label: 'P', title: 'Perdidos' },
  { key: 'goals_for', label: 'GF', title: 'Goles a favor' },
  { key: 'goals_against', label: 'GC', title: 'Goles en contra' },
  { key: 'goal_diff', label: 'DG', title: 'Diferencia de gol' },
] as const

interface StatusMeta {
  label: string
  row: string
  badge: string
  dot: string
}

/** Semáforo (colores NO de marca, ver index.css). */
const STATUS_META: Record<Exclude<StandingStatus, 'neutral'>, StatusMeta> = {
  direct: {
    label: 'Clasifica',
    row: 'bg-ok-50 border-l-2 border-l-ok-600',
    badge: 'bg-ok-100 text-ok-700',
    dot: 'bg-ok-600',
  },
  best: {
    label: 'Mejor 3.º',
    row: 'bg-ok-50 border-l-2 border-l-ok-600',
    badge: 'bg-ok-100 text-ok-700',
    dot: 'bg-ok-600',
  },
  contention: {
    label: 'Repechaje',
    row: 'bg-warn-50 border-l-2 border-l-warn-600',
    badge: 'bg-warn-100 text-warn-600',
    dot: 'bg-warn-600',
  },
  eliminated: {
    label: 'Eliminado',
    row: 'bg-bad-50 border-l-2 border-l-bad-600',
    badge: 'bg-bad-100 text-bad-600',
    dot: 'bg-bad-600',
  },
}

/** Leyenda: solo los estados presentes en la tabla. */
export function StandingsLegend({ statuses }: { statuses: Set<StandingStatus> }) {
  const order: Exclude<StandingStatus, 'neutral'>[] = ['direct', 'best', 'contention', 'eliminated']
  const shown = order.filter((s) => statuses.has(s))
  if (shown.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-tinta-3">
      {shown.map((s) => (
        <span key={s} className="flex items-center gap-1.5">
          <span className={`inline-block h-2 w-2 rounded-full ${STATUS_META[s].dot}`} />
          {STATUS_META[s].label}
        </span>
      ))}
    </div>
  )
}

/**
 * Tabla de posiciones de un grupo. Todos los números salen de la fila de
 * `standings` (calculada en Postgres por recalculate_standings); acá no se
 * suma nada.
 *
 * `statusByTeam` (opcional) pinta cada fila con el semáforo de clasificación
 * (verde = clasifica, ámbar = repechaje, rojo = eliminado). Si no se pasa, cae
 * a `qualifiers` (resalta las primeras N plazas de forma neutra).
 */
export function StandingsTable({
  rows,
  qualifiers = 0,
  statusByTeam,
}: {
  rows: StandingWithTeam[]
  qualifiers?: number
  statusByTeam?: Map<string, StandingStatus>
}) {
  const ordered = [...rows].sort(
    (a, b) => (a.position ?? 99) - (b.position ?? 99) || b.points - a.points,
  )

  return (
    <div className="table-scroll rounded-2xl border border-linea bg-panel">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="border-b border-linea text-[11px] text-tinta-3 uppercase">
            <th className="w-8 px-3 py-2.5 text-center font-semibold">#</th>
            <th className="px-3 py-2.5 text-left font-semibold">Equipo</th>
            {COLS.map((c) => (
              <th key={c.key} title={c.title} className="w-10 px-2 py-2.5 text-center font-semibold">
                {c.label}
              </th>
            ))}
            <th className="w-12 px-3 py-2.5 text-center font-semibold text-tinta-2">PTS</th>
          </tr>
        </thead>
        <tbody>
          {ordered.map((row, i) => {
            const pos = row.position ?? i + 1
            const status = statusByTeam?.get(row.team_id) ?? 'neutral'
            const meta = status !== 'neutral' ? STATUS_META[status] : null
            // Fallback sin semáforo: resalta las primeras N como antes.
            const plainQualifies = !statusByTeam && qualifiers > 0 && pos <= qualifiers
            return (
              <tr
                key={row.id}
                className={`border-b border-linea last:border-0 ${
                  meta ? meta.row : 'hover:bg-crema'
                }`}
              >
                <td className="px-3 py-2.5 text-center">
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                      meta
                        ? meta.badge
                        : plainQualifies
                          ? 'bg-azul-100 text-azul-600'
                          : 'text-tinta-3'
                    }`}
                  >
                    {pos}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <Link to={`/teams/${row.team_id}`} className="min-w-0 hover:opacity-80">
                      <TeamBadge team={row.team} size="sm" />
                    </Link>
                    {meta && (
                      <span
                        className={`flex-none rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${meta.badge}`}
                      >
                        {meta.label}
                      </span>
                    )}
                  </div>
                </td>
                {COLS.map((c) => (
                  <td
                    key={c.key}
                    className={`px-2 py-2.5 text-center tabular-nums ${
                      c.key === 'goal_diff' ? 'text-tinta-2' : 'text-tinta-3'
                    }`}
                  >
                    {c.key === 'goal_diff' && row.goal_diff > 0 ? '+' : ''}
                    {row[c.key]}
                  </td>
                ))}
                <td className="px-3 py-2.5 text-center text-base font-black text-tinta tabular-nums">
                  {row.points}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
