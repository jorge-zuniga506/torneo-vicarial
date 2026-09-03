import { TeamBadge } from './TeamBadge'
import { CategoryBadge } from './CategoryBadge'
import {
  STATUS_LABELS,
  STATUS_PILL,
  STAGE_LABELS_SHORT,
  formatKickoff,
  isLive,
  isWomensMatch,
} from '../utils/matchLabels'
import type { MatchWithTeams } from '../types/tournament'

/**
 * Fila de partido reutilizable (fixtures, detalle de equipo, home). Muestra
 * marcador solo si el partido está en vivo o finalizado; si no, la hora.
 */
export function MatchRow({
  match,
  groupName,
}: {
  match: MatchWithTeams
  groupName?: string | null
}) {
  const live = isLive(match.status)
  const finished = match.status === 'FINALIZADO'
  const showScore = live || finished
  const womens = isWomensMatch(match)
  const context = womens
    ? null
    : groupName
      ? `Grupo ${groupName}`
      : match.stage !== 'GROUP'
        ? STAGE_LABELS_SHORT[match.stage]
        : match.matchday
          ? `Jornada ${match.matchday}`
          : null

  return (
    <article
      className={`flex flex-col gap-3 rounded-2xl border bg-panel p-4 transition-colors sm:flex-row sm:items-center ${
        live ? 'border-vino-400/50' : 'border-linea'
      }`}
    >
      <div className="flex w-full items-center gap-3 sm:w-auto sm:flex-1">
        <span className="w-12 flex-none font-mono text-xs text-tinta-3">
          {formatKickoff(match.scheduled_at)}
        </span>

        <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
          <TeamBadge team={match.home_team} size="sm" />
          <div className="flex flex-none items-center gap-2">
            {showScore ? (
              <span className={`font-mono text-lg font-black ${live ? 'text-vino-600' : 'text-tinta'}`}>
                {match.home_score}
                <span className="mx-1 text-tinta-3">–</span>
                {match.away_score}
              </span>
            ) : (
              <span className="text-xs font-semibold text-tinta-3">vs</span>
            )}
          </div>
          <div className="flex min-w-0 flex-1 justify-end">
            <TeamBadge team={match.away_team} size="sm" />
          </div>
        </div>
      </div>

      <div className="flex flex-none items-center gap-2 pl-14 sm:pl-0">
        {womens && <CategoryBadge category={match.category} />}
        {context && (
          <span className="rounded-full bg-crema px-2 py-0.5 text-[11px] font-medium text-tinta-2">
            {context}
          </span>
        )}
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_PILL[match.status]}`}
        >
          {STATUS_LABELS[match.status]}
        </span>
      </div>
    </article>
  )
}
