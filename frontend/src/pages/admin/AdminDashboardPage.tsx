import { useState } from 'react'
import {
  CalendarClock,
  CalendarDays,
  CircleDot,
  Flag,
  Goal,
  Play,
  Square,
  Trophy,
  Users2,
  UserRound,
} from 'lucide-react'
import { useTournament } from '../../hooks/useTournament'
import { useLiveMatch } from '../../hooks/useLiveMatch'
import { useTeams } from '../../hooks/useTeams'
import { useTournamentPlayers } from '../../hooks/useTournamentPlayers'
import { usePlayerStats } from '../../hooks/usePlayerStats'
import { StatCard } from '../../components/admin/StatCard'
import { updateTournamentStatus } from '../../services/tournament'
import { toast } from '../../lib/toast'
import { formatKickoff, formatKickoffDay } from '../../utils/matchLabels'
import type { Tournament } from '../../types/tournament'

const STATUS_LABEL: Record<Tournament['status'], string> = {
  SETUP: 'Preparación',
  IN_PROGRESS: 'En curso',
  PAUSED: 'En pausa',
  FINISHED: 'Finalizado',
}

export function AdminDashboardPage() {
  const { tournament, settings, loading: loadingT } = useTournament()
  const { matches, liveMatch, nextMatch, loading: loadingM } = useLiveMatch(tournament?.id)
  const { teams } = useTeams(tournament?.id)
  const { players } = useTournamentPlayers(tournament?.id)
  const { stats } = usePlayerStats(tournament?.id)

  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')

  if (loadingT || loadingM) {
    return <p className="py-24 text-center text-tinta-2">Cargando…</p>
  }
  if (!tournament || !settings) {
    return <p className="py-24 text-center text-tinta-2">No hay un torneo configurado.</p>
  }

  const finished = matches.filter((m) => m.status === 'FINALIZADO')
  const scheduled = matches.filter((m) => m.status === 'PROGRAMADO')
  const goals = matches
    .filter((m) => m.status === 'FINALIZADO' || ['EN_JUEGO', 'DESCANSO'].includes(m.status))
    .reduce((sum, m) => sum + m.home_score + m.away_score, 0)
  const yellow = stats.reduce((s, p) => s + (p.yellow_cards ?? 0), 0)
  const red = stats.reduce((s, p) => s + (p.red_cards ?? 0), 0)
  const qualifySlots =
    settings.group_count * settings.qualifiers_per_group + settings.best_third_places

  async function setStatus(status: Tournament['status']) {
    if (!tournament) return
    setWorking(true)
    setError('')
    try {
      const extra =
        status === 'IN_PROGRESS' && !tournament.starts_at
          ? { starts_at: new Date().toISOString() }
          : status === 'FINISHED'
            ? { ends_at: new Date().toISOString() }
            : {}
      await updateTournamentStatus(tournament.id, status, extra)
      toast.ok('Torneo actualizado', STATUS_LABEL[status])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar el estado.')
      toast.err(e, 'No se pudo actualizar el estado del torneo')
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-tinta">Resumen</h1>
          <p className="text-sm text-tinta-2">
            {tournament.name} · Estado:{' '}
            <span className="font-semibold text-tinta">{STATUS_LABEL[tournament.status]}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(tournament.status === 'SETUP' || tournament.status === 'PAUSED') && (
            <button
              type="button"
              disabled={working}
              onClick={() => setStatus('IN_PROGRESS')}
              className="flex items-center gap-1.5 rounded-full bg-azul-600 px-4 py-2 text-sm font-semibold text-white hover:bg-azul-500 disabled:opacity-60"
            >
              <Play className="h-4 w-4" />
              Iniciar torneo
            </button>
          )}
          {tournament.status === 'IN_PROGRESS' && (
            <>
              <button
                type="button"
                disabled={working}
                onClick={() => setStatus('PAUSED')}
                className="rounded-full border border-linea bg-panel px-4 py-2 text-sm font-semibold text-tinta-2 hover:bg-crema disabled:opacity-60"
              >
                Pausar
              </button>
              <button
                type="button"
                disabled={working}
                onClick={() => setStatus('FINISHED')}
                className="flex items-center gap-1.5 rounded-full bg-vino-500 px-4 py-2 text-sm font-semibold text-white hover:bg-vino-600 disabled:opacity-60"
              >
                <Flag className="h-4 w-4" />
                Finalizar
              </button>
            </>
          )}
          {tournament.status === 'FINISHED' && (
            <button
              type="button"
              disabled={working}
              onClick={() => setStatus('IN_PROGRESS')}
              className="rounded-full border border-linea bg-panel px-4 py-2 text-sm font-semibold text-tinta-2 hover:bg-crema disabled:opacity-60"
            >
              Reabrir
            </button>
          )}
        </div>
      </header>

      {error && (
        <p className="rounded-lg border border-vino-400/40 bg-vino-50 px-3 py-2 text-sm text-vino-600">
          {error}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Equipos" value={teams.length} icon={Users2} to="/admin/teams" />
        <StatCard label="Jugadores" value={players.length} icon={UserRound} to="/admin/players" />
        <StatCard
          label="Partidos"
          value={matches.length}
          hint={`${finished.length} finalizados · ${scheduled.length} por jugar`}
          icon={CalendarDays}
          to="/admin/matches"
        />
        <StatCard label="Goles del torneo" value={goals} icon={Goal} />
        <StatCard
          label="Tarjetas"
          value={
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Square className="h-4 w-4 fill-current text-tinta-2" />
                {yellow}
              </span>
              <span className="flex items-center gap-1">
                <Square className="h-4 w-4 fill-current text-vino-600" />
                {red}
              </span>
            </span>
          }
        />
        <StatCard
          label="Cupos de clasificación"
          value={qualifySlots}
          hint={`${settings.qualifiers_per_group} por grupo${settings.best_third_places ? ` + ${settings.best_third_places} mejores 3.º` : ''}`}
          icon={Trophy}
        />
        <StatCard
          label="Partido actual"
          value={
            liveMatch ? (
              `${liveMatch.home_team?.short_name ?? '?'} ${liveMatch.home_score}-${liveMatch.away_score} ${liveMatch.away_team?.short_name ?? '?'}`
            ) : (
              <span className="text-tinta-3">—</span>
            )
          }
          hint={liveMatch ? 'En juego · abrir control' : 'Ningún partido en vivo'}
          icon={CircleDot}
          to={liveMatch ? `/admin/matches/${liveMatch.id}` : undefined}
        />
        <StatCard
          label="Próximo partido"
          value={
            nextMatch ? (
              `${nextMatch.home_team?.short_name ?? '?'} vs ${nextMatch.away_team?.short_name ?? '?'}`
            ) : (
              <span className="text-tinta-3">—</span>
            )
          }
          hint={
            nextMatch
              ? `${formatKickoffDay(nextMatch.scheduled_at)} · ${formatKickoff(nextMatch.scheduled_at)}`
              : undefined
          }
          icon={CalendarClock}
          to={nextMatch ? `/admin/matches/${nextMatch.id}` : undefined}
        />
      </div>
    </div>
  )
}
