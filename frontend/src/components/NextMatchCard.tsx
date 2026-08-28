import { useEffect, useState } from 'react'
import { CalendarClock } from 'lucide-react'
import { TeamBadge } from './TeamBadge'
import { formatCountdown } from '../utils/tournamentStatus'
import type { MatchWithTeams } from '../types/tournament'

export function NextMatchCard({ match }: { match: MatchWithTeams }) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <section className="rounded-3xl border border-linea bg-panel p-6 sm:p-8">
      <div className="mb-4 flex items-center gap-2 text-xs font-bold tracking-widest text-azul-600 uppercase">
        <CalendarClock className="h-4 w-4" />
        Próximo partido
      </div>
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <TeamBadge team={match.home_team} />
          <span className="text-sm font-semibold text-tinta-3">vs</span>
          <TeamBadge team={match.away_team} />
        </div>
        <div className="text-right">
          <p className="text-sm text-tinta-2">
            {new Date(match.scheduled_at).toLocaleTimeString('es-MX', {
              hour: 'numeric',
              minute: '2-digit',
            })}
            {' · '}
            {match.venue}
          </p>
          <p className="font-mono text-2xl font-bold text-azul-600">
            Comienza en {formatCountdown(match.scheduled_at)}
          </p>
        </div>
      </div>
    </section>
  )
}
