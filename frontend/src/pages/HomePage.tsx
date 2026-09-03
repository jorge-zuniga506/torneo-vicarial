import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, GitBranch, Goal, ListOrdered, Trophy, XCircle } from 'lucide-react'
import { useLiveMatch } from '../hooks/useLiveMatch'
import { useTournament } from '../hooks/useTournament'
import { useStandings } from '../hooks/useStandings'
import { useGroups } from '../hooks/useGroups'
import { usePlayerStats } from '../hooks/usePlayerStats'
import { LiveMatchHero } from '../components/LiveMatchHero'
import { NextMatchCard } from '../components/NextMatchCard'
import { PauseBanner, FinishedBanner } from '../components/StatusBanners'
import { MatchRow } from '../components/MatchRow'
import { StandingsTable, StandingsLegend } from '../components/StandingsTable'
import { BracketView } from '../components/BracketView'
import { TeamBadge } from '../components/TeamBadge'
import { CategoryBadge } from '../components/CategoryBadge'
import { isDuringBreak, formatTimeOfDay } from '../utils/tournamentStatus'
import { PERIOD_LABELS } from '../utils/matchClock'
import { formatKickoff, isLive, isWomensMatch } from '../utils/matchLabels'
import { computeQualification } from '../utils/qualifiers'
import { groupStageDone } from '../hooks/useQualification'

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
  const { standings } = useStandings(tournament?.id)
  const { groups, byId: groupsById } = useGroups(tournament?.id)
  const { topScorers } = usePlayerStats(tournament?.id)

  const groupStageComplete = useMemo(() => groupStageDone(matches), [matches])
  const qualification = useMemo(
    () => computeQualification(standings, groups, settings, groupStageComplete),
    [standings, groups, settings, groupStageComplete],
  )
  const womensMatch = useMemo(() => matches.find((m) => isWomensMatch(m)), [matches])
  const hasBracket = useMemo(
    () => matches.some((m) => ['QUARTERFINAL', 'SEMIFINAL', 'FINAL'].includes(m.stage)),
    [matches],
  )

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

      {finalizado && tournament.champion_team_id && (
        <Link
          to="/champion"
          className="flex items-center justify-center gap-2 rounded-2xl border border-azul-200 bg-azul-50 px-4 py-3 text-sm font-bold text-azul-700 hover:bg-azul-100"
        >
          <Trophy className="h-4 w-4" />
          Ver al campeón del torneo
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}

      {nextMatch && !finalizado && <NextMatchCard match={nextMatch} />}

      {womensMatch && (
        <section className="flex flex-col gap-3 rounded-3xl border border-viol-500/30 bg-panel p-6">
          <div className="flex items-center gap-2">
            <CategoryBadge category="FEMENINO" />
            <span className="text-xs font-bold tracking-widest text-tinta-3 uppercase">
              Partido femenino
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <TeamBadge team={womensMatch.home_team} />
              <span className="text-sm font-semibold text-tinta-3">
                {isLive(womensMatch.status) || womensMatch.status === 'FINALIZADO'
                  ? `${womensMatch.home_score} – ${womensMatch.away_score}`
                  : 'vs'}
              </span>
              <TeamBadge team={womensMatch.away_team} />
            </div>
            <p className="text-sm text-tinta-2">
              {womensMatch.status === 'FINALIZADO'
                ? 'Finalizado'
                : isLive(womensMatch.status)
                  ? 'En vivo'
                  : formatKickoff(womensMatch.scheduled_at)}
            </p>
          </div>
        </section>
      )}

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

      {groupStageComplete && qualification.qualified.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionTitle icon={<Trophy className="h-4 w-4" />} to="/bracket">
            Clasificados a cuartos
          </SectionTitle>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {qualification.qualified.map(({ standing, label }) => (
              <div
                key={standing.team_id}
                className="flex flex-col gap-1 rounded-xl border border-azul-200 bg-azul-50 px-3 py-2"
              >
                <span className="text-[10px] font-semibold text-azul-600 uppercase">{label}</span>
                <TeamBadge team={standing.team} size="sm" />
              </div>
            ))}
          </div>
          {qualification.eliminated.map((s) => (
            <div
              key={s.team_id}
              className="flex items-center gap-2 rounded-xl border border-vino-400/40 bg-vino-50 px-3 py-2 text-sm"
            >
              <TeamBadge team={s.team} size="sm" />
              <span className="flex items-center gap-1 text-[11px] font-semibold text-vino-600">
                <XCircle className="h-3.5 w-3.5" />
                Eliminado
              </span>
            </div>
          ))}
        </section>
      )}

      {hasBracket && (groupStageComplete || matches.some((m) => m.stage !== 'GROUP' && m.home_team_id)) && (
        <section className="flex flex-col gap-3">
          <SectionTitle icon={<GitBranch className="h-4 w-4" />} to="/bracket">
            Cuadro de eliminación
          </SectionTitle>
          <BracketView matches={matches} />
        </section>
      )}

      {groups.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionTitle icon={<ListOrdered className="h-4 w-4" />} to="/standings">
            Tabla de posiciones
          </SectionTitle>
          <StandingsLegend statuses={new Set(qualification.statusByTeam.values())} />
          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {groups.map((g) => (
              <div key={g.id} className="flex flex-col gap-2">
                <h3 className="text-xs font-bold tracking-widest text-tinta-3 uppercase">
                  Grupo {g.name}
                </h3>
                <StandingsTable
                  rows={standings.filter((s) => s.group_id === g.id)}
                  qualifiers={settings.qualifiers_per_group}
                  statusByTeam={qualification.statusByTeam}
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
            {settings.team_count} equipos masculinos + 1 partido femenino · {settings.group_count}{' '}
            grupos de {settings.teams_per_group}
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
