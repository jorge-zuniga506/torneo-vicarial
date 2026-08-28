import { ArrowLeftRight, Flag, Goal, Pause, Play, RectangleVertical, Radio, Timer } from 'lucide-react'
import type { ComponentType } from 'react'
import { TeamBadge } from './TeamBadge'
import { useMatchEvents } from '../hooks/useMatchEvents'
import type { MatchWithTeams } from '../types/tournament'

interface EventVisual {
  Icon: ComponentType<{ className?: string }>
  className: string
}

const EVENT_VISUAL: Record<string, EventVisual> = {
  GOAL: { Icon: Goal, className: 'text-azul-600' },
  YELLOW_CARD: { Icon: RectangleVertical, className: 'text-tinta-2 fill-current' },
  RED_CARD: { Icon: RectangleVertical, className: 'text-vino-600 fill-current' },
  SUBSTITUTION: { Icon: ArrowLeftRight, className: 'text-tinta-3' },
  START: { Icon: Play, className: 'text-tinta-3' },
  HALFTIME: { Icon: Pause, className: 'text-tinta-3' },
  RESUME: { Icon: Play, className: 'text-tinta-3' },
  END: { Icon: Flag, className: 'text-tinta-3' },
}

const EVENT_LABEL: Record<string, string> = {
  GOAL: 'Gol',
  YELLOW_CARD: 'Tarjeta amarilla',
  RED_CARD: 'Tarjeta roja',
  SUBSTITUTION: 'Cambio',
  START: 'Inicio del partido',
  HALFTIME: 'Descanso',
  RESUME: 'Segundo tiempo',
  END: 'Final del partido',
}

/** La sección más importante de la página: el partido que se está jugando ahora mismo. */
export function LiveMatchHero({
  match,
  clockLabel,
  periodLabel,
}: {
  match: MatchWithTeams
  clockLabel: string
  periodLabel: string
}) {
  const { events } = useMatchEvents(match.id)

  return (
    <section className="overflow-hidden rounded-3xl border border-vino-500/40 bg-vino-50 p-6 sm:p-10">
      <div className="mb-6 flex items-center justify-center gap-2">
        <Radio className="h-4 w-4 animate-pulse-live text-vino-500" />
        <span className="text-xs font-bold tracking-widest text-vino-600 uppercase">En vivo</span>
        {match.group_id && <span className="text-xs font-medium text-tinta-3">· {match.venue}</span>}
      </div>

      <div className="flex items-center justify-center gap-6 sm:gap-14">
        <TeamBadge team={match.home_team} size="lg" direction="col" />

        <div className="flex flex-col items-center gap-1">
          <div className="flex items-baseline gap-3 text-5xl font-black text-tinta sm:text-6xl">
            <span>{match.home_score}</span>
            <span className="text-2xl text-tinta-3">–</span>
            <span>{match.away_score}</span>
          </div>
          <span className="rounded-full bg-panel px-3 py-1 text-xs font-semibold text-tinta-2">
            {periodLabel}
          </span>
          <span className="mt-1 flex items-center gap-1.5 font-mono text-2xl font-bold text-vino-600">
            <Timer className="h-5 w-5" />
            {clockLabel}
          </span>
        </div>

        <TeamBadge team={match.away_team} size="lg" direction="col" />
      </div>

      {events.length > 0 && (
        <ul className="mx-auto mt-8 flex max-w-md flex-col gap-2 border-t border-linea pt-6">
          {events.slice(0, 4).map((e) => {
            const visual = EVENT_VISUAL[e.event_type]
            const Icon = visual?.Icon
            return (
              <li key={e.id} className="flex items-center gap-2.5 text-sm text-tinta-2">
                {Icon && <Icon className={`h-4 w-4 flex-none ${visual.className}`} />}
                <span className="font-mono text-xs text-tinta-3">
                  {new Date(e.occurred_at).toLocaleTimeString('es-MX', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span>
                  {EVENT_LABEL[e.event_type] ?? e.event_type}
                  {e.player?.name ? ` — ${e.player.name}` : ''}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
