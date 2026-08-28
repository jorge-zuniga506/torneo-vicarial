import { Link } from 'react-router-dom'
import { TeamBadge } from './TeamBadge'
import type { StandingWithTeam } from '../types/tournament'

const COLS = [
  { key: 'played', label: 'PJ', title: 'Partidos jugados' },
  { key: 'won', label: 'G', title: 'Ganados' },
  { key: 'drawn', label: 'E', title: 'Empatados' },
  { key: 'lost', label: 'P', title: 'Perdidos' },
  { key: 'goals_for', label: 'GF', title: 'Goles a favor' },
  { key: 'goals_against', label: 'GC', title: 'Goles en contra' },
  { key: 'goal_diff', label: 'DG', title: 'Diferencia de gol' },
] as const

/**
 * Tabla de posiciones de un grupo. Todos los números salen de la fila de
 * `standings` (calculada en Postgres por recalculate_standings); acá no se
 * suma nada. `qualifiers` resalta las plazas de clasificación.
 */
export function StandingsTable({
  rows,
  qualifiers = 0,
}: {
  rows: StandingWithTeam[]
  qualifiers?: number
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
            const qualifies = qualifiers > 0 && pos <= qualifiers
            return (
              <tr key={row.id} className="border-b border-linea last:border-0 hover:bg-crema">
                <td className="px-3 py-2.5 text-center">
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                      qualifies ? 'bg-azul-100 text-azul-600' : 'text-tinta-3'
                    }`}
                  >
                    {pos}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <Link to={`/teams/${row.team_id}`} className="hover:opacity-80">
                    <TeamBadge team={row.team} size="sm" />
                  </Link>
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
