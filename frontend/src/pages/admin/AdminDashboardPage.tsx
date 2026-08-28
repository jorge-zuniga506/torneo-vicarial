import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, Flag, Play, Radio, Square } from 'lucide-react'
import { useTournament } from '../../hooks/useTournament'
import { useLiveMatch } from '../../hooks/useLiveMatch'
import { useTeams } from '../../hooks/useTeams'
import { useTournamentPlayers } from '../../hooks/useTournamentPlayers'
import { usePlayerStats } from '../../hooks/usePlayerStats'
import { StatCard } from '../../components/admin/StatCard'
import { updateTournamentStatus } from '../../services/tournament'
import { toast } from '../../lib/toast'
import { formatKickoff, formatKickoffDay } from '../../utils/matchLabels'
import type { MatchWithTeams, Tournament } from '../../types/tournament'

const STATUS_LABEL: Record<Tournament['status'], string> = {
  SETUP: 'Preparación',
  IN_PROGRESS: 'En curso',
  PAUSED: 'En pausa',
  FINISHED: 'Finalizado',
}

function teamLabel(t: MatchWithTeams['home_team']): string {
  return t?.short_name ?? t?.name ?? '?'
}

export function AdminDashboardPage() {
  const { tournament, settings, loading: loadingT } = useTournament()
  const { matches, liveMatch, nextMatch, loading: loadingM } = useLiveMatch(tournament?.id)
  const { teams } = useTeams(tournament?.id)
  const { players } = useTournamentPlayers(tournament?.id)
  const { stats } = usePlayerStats(tournament?.id)

  const [working, setWorking] = useState(false)

  if (loadingT || loadingM) {
    return <p className="py-24 text-center text-tinta-2">Cargando…</p>
  }
  if (!tournament || !settings) {
    return <p className="py-24 text-center text-tinta-2">No hay un torneo configurado.</p>
  }

  const played = matches.filter((m) => m.status === 'FINALIZADO').length
  const pending = matches.filter((m) => m.status === 'PROGRAMADO').length
  const goals = matches
    .filter((m) => m.status === 'FINALIZADO' || m.status === 'EN_JUEGO' || m.status === 'DESCANSO')
    .reduce((sum, m) => sum + m.home_score + m.away_score, 0)
  const yellow = stats.reduce((s, p) => s + (p.yellow_cards ?? 0), 0)
  const red = stats.reduce((s, p) => s + (p.red_cards ?? 0), 0)

  async function setStatus(status: Tournament['status']) {
    if (!tournament) return
    setWorking(true)
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
      toast.err(e, 'No se pudo actualizar el estado del torneo')
    } finally {
      setWorking(false)
    }
  }

  const btn =
    'flex flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold disabled:opacity-60 sm:flex-none'

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl font-black text-tinta">Resumen</h1>
          <p className="text-sm text-tinta-2">
            {tournament.name} ·{' '}
            <span className="font-semibold text-tinta">{STATUS_LABEL[tournament.status]}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(tournament.status === 'SETUP' || tournament.status === 'PAUSED') && (
            <button
              type="button"
              disabled={working}
              onClick={() => setStatus('IN_PROGRESS')}
              className={`${btn} bg-azul-600 text-white hover:bg-azul-500`}
            >
              <Play className="h-4 w-4" />
              {tournament.status === 'PAUSED' ? 'Reanudar torneo' : 'Iniciar torneo'}
            </button>
          )}
          {tournament.status === 'IN_PROGRESS' && (
            <>
              <button
                type="button"
                disabled={working}
                onClick={() => setStatus('PAUSED')}
                className={`${btn} border border-linea bg-panel text-tinta-2 hover:bg-crema`}
              >
                Pausar
              </button>
              <button
                type="button"
                disabled={working}
                onClick={() => setStatus('FINISHED')}
                className={`${btn} bg-vino-500 text-white hover:bg-vino-600`}
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
              className={`${btn} border border-linea bg-panel text-tinta-2 hover:bg-crema`}
            >
              Reabrir torneo
            </button>
          )}
        </div>
      </header>

      {/* Números */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Equipos" value={teams.length} to="/admin/teams" />
        <StatCard label="Jugadores" value={players.length} to="/admin/players" />
        <StatCard
          label="Partidos"
          value={matches.length}
          hint={`${played} jugados · ${pending} por jugar`}
          to="/admin/matches"
        />
        <StatCard label="Goles" value={goals} />
        <StatCard
          label="Amarillas"
          value={
            <span className="flex items-center gap-1.5">
              <Square className="h-4 w-4 fill-current text-tinta-3" />
              {yellow}
            </span>
          }
        />
        <StatCard
          label="Rojas"
          value={
            <span className="flex items-center gap-1.5">
              <Square className="h-4 w-4 fill-current text-vino-600" />
              {red}
            </span>
          }
        />
      </div>

      {/* En vivo + próximo */}
      <div className="grid gap-3 sm:grid-cols-2">
        <section
          className={`flex flex-col gap-3 rounded-2xl border bg-panel p-4 ${
            liveMatch ? 'border-vino-400/50' : 'border-linea'
          }`}
        >
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase">
            <Radio
              className={`h-4 w-4 ${liveMatch ? 'animate-pulse-live text-vino-500' : 'text-tinta-3'}`}
            />
            <span className={liveMatch ? 'text-vino-600' : 'text-tinta-3'}>Partido en vivo</span>
          </div>
          {liveMatch ? (
            <>
              <div className="flex items-center justify-center gap-3 text-lg font-black text-tinta">
                <span className="flex-1 truncate text-right">{teamLabel(liveMatch.home_team)}</span>
                <span className="font-mono text-2xl text-vino-600">
                  {liveMatch.home_score}–{liveMatch.away_score}
                </span>
                <span className="flex-1 truncate">{teamLabel(liveMatch.away_team)}</span>
              </div>
              <Link
                to={`/admin/matches/${liveMatch.id}`}
                className="rounded-full bg-azul-600 py-2 text-center text-sm font-semibold text-white hover:bg-azul-500"
              >
                Abrir control en vivo
              </Link>
            </>
          ) : (
            <p className="py-3 text-center text-sm text-tinta-3">Ningún partido en juego</p>
          )}
        </section>

        <section className="flex flex-col gap-3 rounded-2xl border border-linea bg-panel p-4">
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest text-tinta-3 uppercase">
            <CalendarClock className="h-4 w-4" />
            Próximo partido
          </div>
          {nextMatch ? (
            <>
              <div className="flex items-center justify-center gap-2 text-base font-bold text-tinta">
                <span className="flex-1 truncate text-right">{teamLabel(nextMatch.home_team)}</span>
                <span className="text-xs font-semibold text-tinta-3">vs</span>
                <span className="flex-1 truncate">{teamLabel(nextMatch.away_team)}</span>
              </div>
              <p className="text-center text-xs text-tinta-2">
                {formatKickoffDay(nextMatch.scheduled_at)} · {formatKickoff(nextMatch.scheduled_at)}
              </p>
              <Link
                to={`/admin/matches/${nextMatch.id}`}
                className="rounded-full border border-linea py-2 text-center text-sm font-semibold text-tinta-2 hover:bg-crema"
              >
                Abrir
              </Link>
            </>
          ) : (
            <p className="py-3 text-center text-sm text-tinta-3">No hay más partidos programados</p>
          )}
        </section>
      </div>
    </div>
  )
}
