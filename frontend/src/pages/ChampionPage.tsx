import { Crown, Goal, Medal } from 'lucide-react'
import { useTournament } from '../hooks/useTournament'
import { useTeams } from '../hooks/useTeams'
import { useMatches } from '../hooks/useMatches'
import { usePlayers } from '../hooks/usePlayers'
import { usePlayerStats } from '../hooks/usePlayerStats'
import { ComingSoon } from '../components/ComingSoon'
import { TeamBadge } from '../components/TeamBadge'

export function ChampionPage() {
  const { tournament, loading: loadingT } = useTournament()
  const { teams } = useTeams(tournament?.id)
  const { matches } = useMatches(tournament?.id)
  const { topScorers } = usePlayerStats(tournament?.id)

  const championId = tournament?.champion_team_id ?? undefined
  const champion = teams.find((t) => t.id === championId)
  const runnerUp = teams.find((t) => t.id === tournament?.runner_up_team_id)
  const { players } = usePlayers(championId)

  if (loadingT) return <p className="py-24 text-center text-tinta-2">Cargando…</p>

  if (!tournament || !championId || !champion) {
    return (
      <ComingSoon
        title="Campeón del torneo"
        note="Se muestra automáticamente cuando termina la final."
      />
    )
  }

  const finalMatch = matches.find((m) => m.stage === 'FINAL')
  const championIsHome = finalMatch?.home_team_id === championId
  const championGoals = championIsHome ? finalMatch?.home_score : finalMatch?.away_score
  const rivalGoals = championIsHome ? finalMatch?.away_score : finalMatch?.home_score
  const finalDate = tournament.ends_at ?? finalMatch?.scheduled_at
  const topScorer = topScorers[0]

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col items-center gap-4 rounded-3xl border border-azul-200 bg-azul-50 p-8 text-center sm:p-12">
        <span className="flex items-center gap-2 text-xs font-bold tracking-widest text-azul-600 uppercase">
          <Crown className="h-4 w-4" />
          Campeón · {tournament.name}
        </span>

        {champion.logo_url ? (
          <img
            src={champion.logo_url}
            alt={champion.name}
            className="h-28 w-28 rounded-full object-cover shadow-lg"
          />
        ) : (
          <span
            className="flex h-28 w-28 items-center justify-center rounded-full text-3xl font-black text-white shadow-lg"
            style={{ backgroundColor: champion.color ?? '#0d3060' }}
          >
            {champion.short_name.slice(0, 3).toUpperCase()}
          </span>
        )}

        <h1 className="text-4xl font-black text-tinta sm:text-5xl">{champion.name}</h1>

        {finalMatch && finalMatch.status === 'FINALIZADO' && (
          <p className="text-lg font-semibold text-tinta-2">
            Ganó la final {championGoals}–{rivalGoals} a {runnerUp?.name ?? 'su rival'}
          </p>
        )}
        {finalDate && (
          <p className="text-sm text-tinta-3">
            {new Date(finalDate).toLocaleString('es-MX', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </p>
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {runnerUp && (
          <section className="flex flex-col gap-2 rounded-2xl border border-linea bg-panel p-5">
            <span className="flex items-center gap-1.5 text-xs font-bold tracking-widest text-tinta-3 uppercase">
              <Medal className="h-4 w-4" />
              Subcampeón
            </span>
            <TeamBadge team={runnerUp} size="md" />
          </section>
        )}
        {topScorer && (
          <section className="flex flex-col gap-2 rounded-2xl border border-linea bg-panel p-5">
            <span className="flex items-center gap-1.5 text-xs font-bold tracking-widest text-tinta-3 uppercase">
              <Goal className="h-4 w-4" />
              Goleador del torneo
            </span>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-tinta">{topScorer.player?.name ?? '—'}</span>
              <span className="text-sm text-tinta-2">
                {topScorer.team?.short_name} · <span className="font-black text-tinta">{topScorer.goals}</span> goles
              </span>
            </div>
          </section>
        )}
      </div>

      {players.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-bold tracking-widest text-tinta-2 uppercase">
            Plantel campeón
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {players.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-2 rounded-xl border border-linea bg-panel px-3 py-2 text-sm"
              >
                <span className="w-6 flex-none text-center font-mono text-xs text-tinta-3">
                  {p.jersey_number ?? '–'}
                </span>
                <span className="min-w-0 truncate text-tinta">{p.name}</span>
                {p.position && <span className="ml-auto flex-none text-[11px] text-tinta-3">{p.position}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
