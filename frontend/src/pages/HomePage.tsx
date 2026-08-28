import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, Goal, ListOrdered } from 'lucide-react'
import { useLiveMatch } from '../hooks/useLiveMatch'
import { useTournament } from '../hooks/useTournament'
import { useStandings } from '../hooks/useStandings'
import { useGroups } from '../hooks/useGroups'
import { usePlayerStats } from '../hooks/usePlayerStats'
import { LiveMatchHero } from '../components/LiveMatchHero'
import { NextMatchCard } from '../components/NextMatchCard'
import { PauseBanner, FinishedBanner } from '../components/StatusBanners'
import { MatchRow } from '../components/MatchRow'
import { StandingsTable } from '../components/StandingsTable'
import { isDuringBreak, formatTimeOfDay } from '../utils/tournamentStatus'
import { PERIOD_LABELS } from '../utils/matchClock'

function SectionTitle({
  icon,
  children,
  to,
}: {
  icon: ReactNode
  children: ReactNode
  to?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-sm font-bold tracking-widest text-tinta-2 uppercase">
        {icon}
        {children}
      </h2>
      {to && (
        <Link
          to={to}
          className="flex items-center gap-1 text-xs font-medium text-azul-600 hover:text-azul-500"
        >
          Ver todo <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  )
}

export function HomePage() {
  const { tournament, settings, loading: loadingTournament } = useTournament()
  const { matches, liveMatch, nextMatch, recentlyFinished, clock, loading: loadingMatches } =
    useLiveMatch(tournament?.id)
  const { byGroup } = useStandings(tournament?.id)
  const { groups, byId: groupsById } = useGroups(tournament?.id)
  const { topScorers } = usePlayerStats(tournament?.id)

  if (loadingTournament || loadingMatches || !settings) {
    return <p className="py-24 text-center text-tinta-2">Cargando…</p>
  }

  if (!tournament) {
    return <p className="py-24 text-center text-tinta-2">Todavía no hay un torneo configurado.</p>
  }

  const finalizado = tournament.status === 'FINISHED'
  const enPausa = !liveMatch && !finalizado && isDuringBreak(settings)

  const upcoming = matches
    .filter((m) => m.status === 'PROGRAMADO' || m.status === 'CALENTAMIENTO')
    .filter((m) => m.id !== nextMatch?.id)
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    .slice(0, 5)

  const recent = recentlyFinished.slice(0, 4)
  const groupName = (gid: string | null) => (gid ? groupsById.get(gid)?.name ?? null : null)

  return (
    <div className="flex flex-col gap-10">
      {liveMatch && clock ? (
        <LiveMatchHero
          match={liveMatch}
          clockLabel={clock.label}
          periodLabel={PERIOD_LABELS[liveMatch.current_period]}
        />
      ) : finalizado ? (
        <FinishedBanner />
      ) : enPausa ? (
        <PauseBanner
          resumeTime={settings.break_end_time ? formatTimeOfDay(settings.break_end_time) : null}
        />
      ) : null}

      {nextMatch && !finalizado && <NextMatchCard match={nextMatch} />}

      {recent.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionTitle icon={<Goal className="h-4 w-4" />} to="/fixtures?tab=finalizados">
            Resultados recientes
          </SectionTitle>
          <div className="flex flex-col gap-2.5">
            {recent.map((m) => (
              <MatchRow key={m.id} match={m} groupName={groupName(m.group_id)} />
            ))}
          </div>
        </section>
      )}

      {groups.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionTitle icon={<ListOrdered className="h-4 w-4" />} to="/standings">
            Tabla de posiciones
          </SectionTitle>
          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {groups.map((g) => (
              <div key={g.id} className="flex flex-col gap-2">
                <h3 className="text-xs font-bold tracking-widest text-tinta-3 uppercase">
                  Grupo {g.name}
                </h3>
                <StandingsTable
                  rows={byGroup.get(g.id) ?? []}
                  qualifiers={settings.qualifiers_per_group}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionTitle icon={<CalendarDays className="h-4 w-4" />} to="/fixtures">
            Próximos partidos
          </SectionTitle>
          <div className="flex flex-col gap-2.5">
            {upcoming.map((m) => (
              <MatchRow key={m.id} match={m} groupName={groupName(m.group_id)} />
            ))}
          </div>
        </section>
      )}

      {topScorers.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionTitle icon={<Goal className="h-4 w-4" />}>Goleadores</SectionTitle>
          <ol className="divide-y divide-linea rounded-2xl border border-linea bg-panel">
            {topScorers.slice(0, 5).map((s, i) => (
              <li key={s.player_id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span className="w-5 text-center font-mono text-xs text-tinta-3">{i + 1}</span>
                <span className="flex-1 text-tinta">{s.player?.name ?? '—'}</span>
                <span className="text-xs text-tinta-3">{s.team?.short_name}</span>
                <span className="font-black text-tinta tabular-nums">{s.goals}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="grid gap-4 rounded-3xl border border-linea bg-panel p-6 sm:grid-cols-3">
        <div>
          <p className="text-xs text-tinta-3 uppercase">Formato</p>
          <p className="mt-1 text-sm text-tinta">
            {settings.team_count} equipos · {settings.group_count} grupos de{' '}
            {settings.teams_per_group}
          </p>
        </div>
        <div>
          <p className="text-xs text-tinta-3 uppercase">Duración de partido</p>
          <p className="mt-1 text-sm text-tinta">
            {settings.first_half_minutes}′ + {settings.second_half_minutes}′ (descanso{' '}
            {settings.halftime_minutes}′)
          </p>
        </div>
        <div>
          <p className="text-xs text-tinta-3 uppercase">Horario</p>
          <p className="mt-1 text-sm text-tinta">
            {formatTimeOfDay(settings.tournament_start_time)} –{' '}
            {formatTimeOfDay(settings.tournament_end_time)}
            {settings.break_start_time && settings.break_end_time && (
              <>
                {' '}
                · pausa {formatTimeOfDay(settings.break_start_time)}–
                {formatTimeOfDay(settings.break_end_time)}
              </>
            )}
          </p>
        </div>
      </section>
    </div>
  )
}
