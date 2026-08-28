import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Flag,
  Goal,
  Pause,
  Play,
  RectangleVertical,
  RotateCcw,
  SkipForward,
  Timer,
} from 'lucide-react'
import { useMatch } from '../../hooks/useMatch'
import { useMatchEvents } from '../../hooks/useMatchEvents'
import { usePlayers } from '../../hooks/usePlayers'
import { useTournament } from '../../hooks/useTournament'
import {
  recordGoal,
  recordCard,
  undoGoal,
  setScore,
  runClock,
  resetMatch,
} from '../../services/matchControl'
import type { ClockAction } from '../../services/matchControl'
import { toast } from '../../lib/toast'
import { elapsedNowSeconds, formatClock, currentMatchMinute, PERIOD_LABELS } from '../../utils/matchClock'
import type { MatchWithTeams, Player } from '../../types/tournament'

const CLOCK_MSG: Record<ClockAction, string> = {
  start: 'Partido iniciado',
  pause: 'Cronómetro en pausa',
  resume: 'Cronómetro reanudado',
  halftime: 'Entretiempo',
  second_half: 'Segundo tiempo',
  finish: 'Partido finalizado',
}

const EVENT_LABEL: Record<string, string> = {
  GOAL: 'Gol',
  YELLOW_CARD: 'Amarilla',
  RED_CARD: 'Roja',
  START: 'Inicio',
  HALFTIME: 'Descanso',
  RESUME: 'Segundo tiempo',
  END: 'Final',
  SUBSTITUTION: 'Cambio',
}

/** "Ahora" en ms, refrescado cada segundo (y al volver a la pestaña) — hace correr el cronómetro. */
function useNow() {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const tick = () => setNow(Date.now())
    const id = setInterval(tick, 1000)
    document.addEventListener('visibilitychange', tick)
    window.addEventListener('focus', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
      window.removeEventListener('focus', tick)
    }
  }, [])
  return now
}

export function AdminMatchControlPage() {
  const { id } = useParams<{ id: string }>()
  const { match, loading, error, refetch: refetchMatch } = useMatch(id)
  const { events, refetch: refetchEvents } = useMatchEvents(id)
  const { settings } = useTournament()
  const { players: homePlayers } = usePlayers(match?.home_team_id ?? undefined)
  const { players: awayPlayers } = usePlayers(match?.away_team_id ?? undefined)

  const now = useNow()
  const running = !!match?.started_at

  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')
  const [homeScorer, setHomeScorer] = useState('')
  const [awayScorer, setAwayScorer] = useState('')
  const [scorePanel, setScorePanel] = useState(false)
  const [scoreDraft, setScoreDraft] = useState({ home: 0, away: 0 })
  const [confirmReset, setConfirmReset] = useState(false)

  async function run(fn: () => Promise<void>, okMsg?: string) {
    setBusy(true)
    setActionError('')
    try {
      await fn()
      // No dependemos solo de Realtime: forzamos una relectura ya para que
      // la UI no se quede "pegada" si el evento tarda o se pierde.
      refetchMatch()
      refetchEvents()
      if (okMsg) toast.ok(okMsg)
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'La acción falló.')
      toast.err(e, 'La acción falló')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <p className="py-24 text-center text-tinta-2">Cargando…</p>
  if (error || !match)
    return (
      <div className="py-24 text-center text-tinta-2">
        <p>{error ?? 'Partido no encontrado.'}</p>
        <Link to="/admin/matches" className="mt-3 inline-block text-sm text-azul-600 hover:underline">
          Volver a partidos
        </Link>
      </div>
    )

  const minute = settings ? currentMatchMinute(match, settings, now) : null
  const elapsed = formatClock(elapsedNowSeconds(match, now)).replace('+', '')

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/admin/matches"
        className="flex items-center gap-1.5 text-sm text-tinta-2 hover:text-tinta"
      >
        <ArrowLeft className="h-4 w-4" />
        Partidos
      </Link>

      {/* Marcador y cronómetro */}
      <section className="rounded-3xl border border-linea bg-panel p-6 text-center">
        <div className="flex items-center justify-center gap-6 sm:gap-12">
          <div className="flex-1 text-right text-lg font-bold text-tinta">
            {match.home_team?.name ?? 'Local'}
          </div>
          <div className="flex items-baseline gap-2 text-5xl font-black text-tinta">
            <span>{match.home_score}</span>
            <span className="text-2xl text-tinta-3">–</span>
            <span>{match.away_score}</span>
          </div>
          <div className="flex-1 text-left text-lg font-bold text-tinta">
            {match.away_team?.name ?? 'Visitante'}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-center gap-3">
          <span className="rounded-full bg-crema px-3 py-1 text-xs font-semibold text-tinta-2">
            {PERIOD_LABELS[match.current_period]}
          </span>
          <span className="flex items-center gap-1.5 font-mono text-xl font-bold text-tinta">
            <Timer className="h-5 w-5" />
            {elapsed}
            {!running && match.current_period !== 'PRE' && match.current_period !== 'ENDED' && (
              <span className="text-xs font-normal text-tinta-3">(en pausa)</span>
            )}
          </span>
        </div>
      </section>

      {actionError && (
        <p className="rounded-lg border border-vino-400/40 bg-vino-50 px-3 py-2 text-sm text-vino-600">
          {actionError}
        </p>
      )}

      {/* Cronómetro */}
      <section className="flex flex-wrap gap-2">
        <ClockButtons
          match={match}
          busy={busy}
          onRun={(a) => run(() => runClock(match.id, a), CLOCK_MSG[a])}
        />
      </section>

      {/* Goles y tarjetas por equipo */}
      <div className="grid gap-4 sm:grid-cols-2">
        <TeamPanel
          side="Local"
          team={match.home_team}
          players={homePlayers}
          scorer={homeScorer}
          setScorer={setHomeScorer}
          disabled={busy || !match.home_team_id}
          onGoal={() =>
            run(
              () => recordGoal(match.id, match.home_team_id!, homeScorer || null, { minute }),
              'Gol registrado',
            )
          }
          onCard={(type) =>
            run(
              () => recordCard(match.id, match.home_team_id!, homeScorer || null, type, minute),
              type === 'RED_CARD' ? 'Tarjeta roja registrada' : 'Tarjeta amarilla registrada',
            )
          }
        />
        <TeamPanel
          side="Visitante"
          team={match.away_team}
          players={awayPlayers}
          scorer={awayScorer}
          setScorer={setAwayScorer}
          disabled={busy || !match.away_team_id}
          onGoal={() =>
            run(
              () => recordGoal(match.id, match.away_team_id!, awayScorer || null, { minute }),
              'Gol registrado',
            )
          }
          onCard={(type) =>
            run(
              () => recordCard(match.id, match.away_team_id!, awayScorer || null, type, minute),
              type === 'RED_CARD' ? 'Tarjeta roja registrada' : 'Tarjeta amarilla registrada',
            )
          }
        />
      </div>

      {/* Corregir marcador */}
      <section className="rounded-2xl border border-linea bg-panel p-4">
        {scorePanel ? (
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs font-medium text-tinta-2">
              {match.home_team?.short_name ?? 'Local'}
              <input
                type="number"
                min={0}
                value={scoreDraft.home}
                onChange={(e) => setScoreDraft({ ...scoreDraft, home: Number(e.target.value) })}
                className="w-20 rounded-lg border border-linea bg-crema px-3 py-2 text-sm text-tinta outline-none focus:border-azul-600"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-tinta-2">
              {match.away_team?.short_name ?? 'Visitante'}
              <input
                type="number"
                min={0}
                value={scoreDraft.away}
                onChange={(e) => setScoreDraft({ ...scoreDraft, away: Number(e.target.value) })}
                className="w-20 rounded-lg border border-linea bg-crema px-3 py-2 text-sm text-tinta outline-none focus:border-azul-600"
              />
            </label>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                run(async () => {
                  await setScore(match.id, scoreDraft.home, scoreDraft.away)
                  setScorePanel(false)
                }, 'Marcador corregido')
              }
              className="rounded-full bg-azul-600 px-4 py-2 text-sm font-semibold text-white hover:bg-azul-500 disabled:opacity-60"
            >
              Guardar marcador
            </button>
            <button
              type="button"
              onClick={() => setScorePanel(false)}
              className="rounded-full border border-linea px-4 py-2 text-sm text-tinta-2 hover:bg-crema"
            >
              Cancelar
            </button>
            <p className="w-full text-[11px] text-tinta-3">
              Corrige el marcador sin registrar eventos. Recalcula la tabla si el partido es de grupos.
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setScoreDraft({ home: match.home_score, away: match.away_score })
              setScorePanel(true)
            }}
            className="text-sm font-medium text-azul-600 hover:underline"
          >
            Corregir marcador manualmente
          </button>
        )}
      </section>

      {/* Feed de eventos */}
      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-bold tracking-widest text-tinta-2 uppercase">Eventos</h2>
        {events.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-linea-2 py-8 text-center text-sm text-tinta-3">
            Sin eventos todavía.
          </p>
        ) : (
          <ul className="divide-y divide-linea rounded-2xl border border-linea bg-panel">
            {events.map((e) => {
              const teamShort =
                e.team_id === match.home_team_id
                  ? match.home_team?.short_name
                  : e.team_id === match.away_team_id
                    ? match.away_team?.short_name
                    : null
              return (
                <li key={e.id} className="flex items-center gap-2.5 px-4 py-2.5 text-sm">
                  <EventGlyph type={e.event_type} />
                  <span className="font-mono text-xs text-tinta-3">
                    {e.minute != null ? `${e.minute}'` : '—'}
                  </span>
                  <span className="flex-1 text-tinta">
                    {EVENT_LABEL[e.event_type] ?? e.event_type}
                    {teamShort ? ` · ${teamShort}` : ''}
                    {e.player?.name ? ` — ${e.player.name}` : ''}
                  </span>
                  {e.event_type === 'GOAL' && e.team_id && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => run(() => undoGoal(match.id, e.team_id!, e.id), 'Gol deshecho')}
                      className="flex items-center gap-1 rounded-full border border-linea px-2 py-0.5 text-[11px] text-tinta-2 hover:bg-crema disabled:opacity-60"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Deshacer
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Reiniciar partido */}
      <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-vino-400/40 bg-vino-50 p-4">
        <div className="flex-1">
          <p className="text-sm font-semibold text-vino-600">Reiniciar partido</p>
          <p className="text-[11px] text-tinta-2">
            Vuelve a 0-0 y PROGRAMADO, borra los eventos y el cronómetro, y recalcula la tabla.
          </p>
        </div>
        {confirmReset ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-tinta-2">¿Seguro?</span>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                run(async () => {
                  await resetMatch(match.id)
                  setConfirmReset(false)
                }, 'Partido reiniciado')
              }
              className="rounded-full bg-vino-500 px-4 py-2 text-sm font-semibold text-white hover:bg-vino-600 disabled:opacity-60"
            >
              Sí, reiniciar
            </button>
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="rounded-full border border-linea px-4 py-2 text-sm text-tinta-2 hover:bg-panel"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirmReset(true)}
            className="flex items-center gap-1.5 rounded-full border border-vino-400/50 px-4 py-2 text-sm font-semibold text-vino-600 hover:bg-vino-100 disabled:opacity-60"
          >
            <RotateCcw className="h-4 w-4" />
            Reiniciar
          </button>
        )}
      </section>
    </div>
  )
}

function EventGlyph({ type }: { type: string }) {
  if (type === 'GOAL') return <Goal className="h-4 w-4 flex-none text-azul-600" />
  if (type === 'YELLOW_CARD')
    return <RectangleVertical className="h-4 w-4 flex-none fill-current text-tinta-2" />
  if (type === 'RED_CARD')
    return <RectangleVertical className="h-4 w-4 flex-none fill-current text-vino-600" />
  return <span className="h-4 w-4 flex-none" />
}

function ClockButtons({
  match,
  busy,
  onRun,
}: {
  match: MatchWithTeams
  busy: boolean
  onRun: (a: ClockAction) => void
}) {
  const { status, current_period, started_at } = match
  const running = !!started_at
  const btn =
    'flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-60'
  const primary = `${btn} bg-azul-600 text-white hover:bg-azul-500`
  const ghost = `${btn} border border-linea bg-panel text-tinta-2 hover:bg-crema`
  const danger = `${btn} bg-vino-500 text-white hover:bg-vino-600`

  if (status === 'FINALIZADO') {
    return <p className="text-sm text-tinta-3">Partido finalizado. Editá el estado desde la lista si necesitás reabrirlo.</p>
  }
  if (current_period === 'PRE') {
    return (
      <button type="button" disabled={busy} className={primary} onClick={() => onRun('start')}>
        <Play className="h-4 w-4" />
        Iniciar partido
      </button>
    )
  }
  if (current_period === 'HALFTIME') {
    return (
      <button type="button" disabled={busy} className={primary} onClick={() => onRun('second_half')}>
        <SkipForward className="h-4 w-4" />
        Iniciar 2.º tiempo
      </button>
    )
  }

  return (
    <>
      {running ? (
        <button type="button" disabled={busy} className={ghost} onClick={() => onRun('pause')}>
          <Pause className="h-4 w-4" />
          Pausar
        </button>
      ) : (
        <button type="button" disabled={busy} className={primary} onClick={() => onRun('resume')}>
          <Play className="h-4 w-4" />
          Reanudar
        </button>
      )}
      {current_period === 'FIRST_HALF' && (
        <button type="button" disabled={busy} className={ghost} onClick={() => onRun('halftime')}>
          <Pause className="h-4 w-4" />
          Ir a descanso
        </button>
      )}
      {current_period === 'SECOND_HALF' && (
        <button type="button" disabled={busy} className={danger} onClick={() => onRun('finish')}>
          <Flag className="h-4 w-4" />
          Finalizar partido
        </button>
      )}
    </>
  )
}

function TeamPanel({
  side,
  team,
  players,
  scorer,
  setScorer,
  disabled,
  onGoal,
  onCard,
}: {
  side: string
  team: MatchWithTeams['home_team']
  players: Player[]
  scorer: string
  setScorer: (v: string) => void
  disabled: boolean
  onGoal: () => void
  onCard: (type: 'YELLOW_CARD' | 'RED_CARD') => void
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-linea bg-panel p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-tinta">{team?.name ?? side}</span>
        <span className="text-[11px] text-tinta-3 uppercase">{side}</span>
      </div>

      <select
        value={scorer}
        onChange={(e) => setScorer(e.target.value)}
        disabled={disabled || players.length === 0}
        className="rounded-lg border border-linea bg-crema px-3 py-2 text-sm text-tinta outline-none focus:border-azul-600 disabled:opacity-60"
      >
        <option value="">{players.length === 0 ? 'Sin jugadores cargados' : 'Sin jugador'}</option>
        {players.map((p) => (
          <option key={p.id} value={p.id}>
            {p.jersey_number != null ? `${p.jersey_number} · ` : ''}
            {p.name}
          </option>
        ))}
      </select>

      <button
        type="button"
        disabled={disabled}
        onClick={onGoal}
        className="flex items-center justify-center gap-1.5 rounded-full bg-azul-600 py-2.5 text-sm font-semibold text-white hover:bg-azul-500 disabled:opacity-60"
      >
        <Goal className="h-4 w-4" />
        Gol
      </button>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onCard('YELLOW_CARD')}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-linea py-2 text-sm font-semibold text-tinta-2 hover:bg-crema disabled:opacity-60"
        >
          <RectangleVertical className="h-4 w-4 fill-current text-tinta-2" />
          Amarilla
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onCard('RED_CARD')}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-linea py-2 text-sm font-semibold text-vino-600 hover:bg-vino-50 disabled:opacity-60"
        >
          <RectangleVertical className="h-4 w-4 fill-current text-vino-600" />
          Roja
        </button>
      </div>
    </div>
  )
}
