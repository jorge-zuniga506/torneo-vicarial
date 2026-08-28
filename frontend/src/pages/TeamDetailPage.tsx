import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Goal, Shirt } from 'lucide-react'
import { useTournament } from '../hooks/useTournament'
import { useTeams } from '../hooks/useTeams'
import { useMatches } from '../hooks/useMatches'
import { useStandings } from '../hooks/useStandings'
import { useGroups } from '../hooks/useGroups'
import { usePlayers } from '../hooks/usePlayers'
import { usePlayerStats } from '../hooks/usePlayerStats'
import { TeamBadge } from '../components/TeamBadge'
import { MatchRow } from '../components/MatchRow'
import { isLive } from '../utils/matchLabels'

export function TeamDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { tournament } = useTournament()
  const { teams, loading: loadingTeams } = useTeams(tournament?.id)
  const { matches, loading: loadingMatches } = useMatches(tournament?.id)
  const { standings } = useStandings(tournament?.id)
  const { byId: groupsById } = useGroups(tournament?.id)
  const { players, loading: loadingPlayers } = usePlayers(id)
  const { stats } = usePlayerStats(tournament?.id)

  if (loadingTeams || loadingMatches) {
    return <p className="py-24 text-center text-tinta-2">Cargando…</p>
  }

  const team = teams.find((t) => t.id === id)
  if (!team) {
    return (
      <div className="py-24 text-center text-tinta-2">
        <p>No encontramos ese equipo.</p>
        <Link
          to="/teams"
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-azul-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Ver todos los equipos
        </Link>
      </div>
    )
  }

  const standing = standings.find((s) => s.team_id === team.id)
  const groupName = team.group_id ? groupsById.get(team.group_id)?.name : null
  const teamMatches = matches.filter((m) => m.home_team_id === team.id || m.away_team_id === team.id)
  const played = teamMatches.filter((m) => m.status === 'FINALIZADO' || isLive(m.status))
  const upcoming = teamMatches.filter((m) => m.status !== 'FINALIZADO' && !isLive(m.status))
  const teamStats = stats.filter((s) => s.team_id === team.id)
  const topScorer = [...teamStats].sort((a, b) => (b.goals ?? 0) - (a.goals ?? 0))[0]

  const summary = [
    ['PJ', standing?.played ?? 0],
    ['G', standing?.won ?? 0],
    ['E', standing?.drawn ?? 0],
    ['P', standing?.lost ?? 0],
    ['GF', standing?.goals_for ?? 0],
    ['GC', standing?.goals_against ?? 0],
    ['DG', (standing?.goal_diff ?? 0) > 0 ? `+${standing?.goal_diff}` : (standing?.goal_diff ?? 0)],
    ['PTS', standing?.points ?? 0],
  ] as const

  return (
    <div className="flex flex-col gap-8">
      <Link
        to="/teams"
        className="flex items-center gap-1.5 text-sm text-tinta-2 hover:text-tinta"
      >
        <ArrowLeft className="h-4 w-4" />
        Equipos
      </Link>

      <header
        className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-linea p-6"
        style={{
          background: `linear-gradient(135deg, ${team.color ?? '#0d3060'}18, #ffffff)`,
        }}
      >
        <TeamBadge team={team} size="lg" />
        <div className="text-right text-sm text-tinta-2">
          {groupName && <p>Grupo {groupName}</p>}
          {standing?.position && <p className="text-tinta">Posición {standing.position}.º</p>}
        </div>
      </header>

      <section className="grid grid-cols-4 gap-2 sm:grid-cols-8">
        {summary.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-linea bg-panel py-3 text-center">
            <p className="text-lg font-black text-tinta tabular-nums">{value}</p>
            <p className="text-[10px] text-tinta-3">{label}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <section className="flex flex-col gap-3">
          <h2 className="flex items-center gap-2 text-sm font-bold tracking-widest text-tinta-2 uppercase">
            <Shirt className="h-4 w-4" />
            Plantel
          </h2>
          {loadingPlayers ? (
            <p className="text-sm text-tinta-3">Cargando…</p>
          ) : players.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-linea-2 py-8 text-center text-sm text-tinta-3">
              Todavía no se cargaron jugadores.
            </p>
          ) : (
            <ul className="divide-y divide-linea rounded-2xl border border-linea bg-panel">
              {players.map((p) => {
                const ps = teamStats.find((s) => s.player_id === p.id)
                return (
                  <li key={p.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                    <span className="w-6 flex-none text-center font-mono text-xs text-tinta-3">
                      {p.jersey_number ?? '–'}
                    </span>
                    <span className="flex-1 text-tinta">
                      {p.name}
                      {team.captain_player_id === p.id && (
                        <span className="ml-2 rounded bg-crema px-1 text-[10px] text-tinta-2">C</span>
                      )}
                    </span>
                    {p.position && <span className="text-xs text-tinta-3">{p.position}</span>}
                    {ps && (ps.goals ?? 0) > 0 && (
                      <span className="flex items-center gap-1 text-xs text-tinta-2">
                        <Goal className="h-3.5 w-3.5" />
                        {ps.goals}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
          {topScorer && (topScorer.goals ?? 0) > 0 && (
            <p className="text-xs text-tinta-3">
              Goleador del equipo:{' '}
              <span className="text-tinta-2">
                {topScorer.player?.name} ({topScorer.goals})
              </span>
            </p>
          )}
        </section>

        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-bold tracking-widest text-tinta-2 uppercase">Resultados</h2>
            {played.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-linea-2 py-8 text-center text-sm text-tinta-3">
                Sin partidos jugados todavía.
              </p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {played.map((m) => (
                  <MatchRow
                    key={m.id}
                    match={m}
                    groupName={m.group_id ? groupsById.get(m.group_id)?.name : null}
                  />
                ))}
              </div>
            )}
          </div>

          {upcoming.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-bold tracking-widest text-tinta-2 uppercase">
                Próximos partidos
              </h2>
              <div className="flex flex-col gap-2.5">
                {upcoming.map((m) => (
                  <MatchRow
                    key={m.id}
                    match={m}
                    groupName={m.group_id ? groupsById.get(m.group_id)?.name : null}
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
