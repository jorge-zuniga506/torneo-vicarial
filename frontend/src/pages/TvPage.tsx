import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { LogOut, Radio, Trophy } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useTournament } from '../hooks/useTournament'
import { useQualification } from '../hooks/useQualification'
import { useTvEvents } from '../hooks/useTvEvents'
import { TeamBadge } from '../components/TeamBadge'
import { CategoryBadge } from '../components/CategoryBadge'
import { elapsedNowSeconds, formatClock, PERIOD_LABELS } from '../utils/matchClock'
import { isDuringBreak, formatCountdown, formatTimeOfDay } from '../utils/tournamentStatus'
import { isWomensMatch } from '../utils/matchLabels'
import type { StandingStatus } from '../utils/qualifiers'
import type { EventType, Group, MatchWithTeams, StandingWithTeam, Team } from '../types/tournament'
import logo from '../assets/logo.png'

/* ─────────────── helpers ─────────────── */

function useNowMs(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const tick = () => setNow(Date.now())
    const id = setInterval(tick, intervalMs)
    document.addEventListener('visibilitychange', tick)
    window.addEventListener('focus', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
      window.removeEventListener('focus', tick)
    }
  }, [intervalMs])
  return now
}

/** Estado del WebSocket de Realtime (para el indicador de conexión). */
function useRealtimeHealth() {
  const [healthy, setHealthy] = useState(false)
  useEffect(() => {
    const ch = supabase
      .channel(`tv-health-${Math.random().toString(36).slice(2)}`)
      .subscribe((status) => setHealthy(status === 'SUBSCRIBED'))
    return () => {
      supabase.removeChannel(ch)
    }
  }, [])
  return healthy
}

/** No dejar que se apague la pantalla del proyector. */
function useWakeLock() {
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null
    const nav = navigator as Navigator & {
      wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> }
    }
    const acquire = () => {
      nav.wakeLock
        ?.request('screen')
        .then((l) => {
          lock = l
        })
        .catch(() => {})
    }
    acquire()
    const onVisible = () => document.visibilityState === 'visible' && acquire()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      lock?.release().catch(() => {})
    }
  }, [])
}

/* ─────────────── banner de eventos ─────────────── */

type BannerKind = 'goal' | 'yellow' | 'red' | 'start' | 'halftime' | 'second_half' | 'final'

interface Banner {
  id: string
  kind: BannerKind
  team: Team | null
  player: string | null
  score: string | null
  homeName: string
  awayName: string
}

const EVENT_TO_KIND: Partial<Record<EventType, BannerKind>> = {
  GOAL: 'goal',
  YELLOW_CARD: 'yellow',
  RED_CARD: 'red',
  START: 'start',
  HALFTIME: 'halftime',
  RESUME: 'second_half',
  END: 'final',
}

const BANNER_MS: Record<BannerKind, number> = {
  goal: 4800,
  yellow: 4000,
  red: 4600,
  start: 4000,
  halftime: 4000,
  second_half: 4000,
  final: 5500,
}

const STATE_BANNER: Record<'start' | 'halftime' | 'second_half' | 'final', { title: string; bg: string }> = {
  start: { title: 'COMIENZA', bg: 'bg-azul-600' },
  halftime: { title: 'ENTRETIEMPO', bg: 'bg-viol-600' },
  second_half: { title: '2.º TIEMPO', bg: 'bg-azul-600' },
  final: { title: 'FINAL', bg: 'bg-vino-600' },
}

function SoccerBall({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <circle cx="32" cy="32" r="29" fill="#ffffff" stroke="#12101a" strokeWidth="2.4" />
      <path d="M32 17.5l10.5 7.6-4 12.4H25.5l-4-12.4z" fill="#12101a" />
      <path d="M32 2.6l5.4 7.2H26.6z" fill="#12101a" />
      <path d="M61.4 32l-7.2 5.4V26.6z" fill="#12101a" />
      <path d="M2.6 32l7.2-5.4v10.8z" fill="#12101a" />
      <path d="M15 52.6l-2.7-8.4 7.6 2.6z" fill="#12101a" />
      <path d="M49 52.6l2.7-8.4-7.6 2.6z" fill="#12101a" />
      <g stroke="#12101a" strokeWidth="1.9" fill="none" strokeLinecap="round">
        <path d="M32 9.8v7.7M42.5 25.1l8.5-3.7M38.5 37.5l4.9 7.3M25.5 37.5l-4.9 7.3M21.5 25.1l-8.5-3.7" />
      </g>
    </svg>
  )
}

const VINO = '#99122f'

/** Balón dentro de un anillo con destellos radiales (color vino de marca). */
function GoalBurst({ className = '' }: { className?: string }) {
  const rays = Array.from({ length: 12 }, (_, i) => (i * 360) / 12)
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
        {rays.map((a) => (
          <line
            key={a}
            x1="100"
            y1="48"
            x2="100"
            y2="32"
            transform={`rotate(${a} 100 100)`}
            stroke={VINO}
            strokeWidth="5"
            strokeLinecap="round"
          />
        ))}
        <circle cx="100" cy="100" r="46" fill="none" stroke={VINO} strokeWidth="4" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <SoccerBall className="tv-ball h-[44%] w-[44%]" />
      </div>
    </div>
  )
}

const CONFETTI_COLORS = ['#99122f', '#c33b53', '#736e7b', '#1a1420', '#d7cfd0']

interface Confetti {
  left: number
  top: number
  rot: number
  w: number
  h: number
  color: string
  delay: number
}
function makeConfetti(n: number): Confetti[] {
  return Array.from({ length: n }, () => ({
    left: Math.random() * 94 + 1,
    top: Math.random() * 82 + 1,
    rot: Math.random() * 360,
    w: Math.random() * 7 + 5,
    h: Math.random() * 5 + 4,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    delay: Math.random() * 0.25,
  }))
}

function EventBanner({ b }: { b: Banner }) {
  const wrap = 'fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 px-8 text-center'
  const teamName = b.team?.name ?? null
  const confetti = useMemo(() => (b.kind === 'goal' ? makeConfetti(30) : []), [b.kind])

  if (b.kind === 'goal') {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-tinta/40 px-6">
        <div className="tv-pop relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-linea bg-crema px-10 py-12 text-center shadow-2xl">
          <div className="pointer-events-none absolute inset-0">
            {confetti.map((c, i) => (
              <span
                key={i}
                className="absolute block"
                style={{ left: `${c.left}%`, top: `${c.top}%`, transform: `rotate(${c.rot}deg)` }}
              >
                <span
                  className="tv-confetti block rounded-[1px]"
                  style={{
                    width: c.w,
                    height: c.h,
                    backgroundColor: c.color,
                    animationDelay: `${c.delay}s`,
                  }}
                />
              </span>
            ))}
          </div>

          <div className="relative flex flex-col items-center gap-3">
            <GoalBurst className="h-44 w-44 lg:h-52 lg:w-52" />
            <p className="text-7xl font-black tracking-tight text-vino-600 lg:text-8xl">¡GOL!</p>
            {b.player && (
              <p className="text-2xl font-bold text-tinta lg:text-3xl">{b.player}</p>
            )}
            {teamName && (
              <p className="text-xl font-black tracking-wide text-tinta uppercase lg:text-2xl">
                {teamName}
              </p>
            )}
            {b.score && (
              <p className="text-lg font-bold text-tinta-2 tabular-nums">{b.score}</p>
            )}
            <span className="mt-1 h-1.5 w-24 rounded-full bg-vino-500" />
          </div>
        </div>
      </div>
    )
  }

  if (b.kind === 'yellow' || b.kind === 'red') {
    const yellow = b.kind === 'yellow'
    return (
      <div className={`${wrap} bg-tinta text-white`}>
        <div className="flex flex-col items-center gap-8">
          <div
            className="tv-card-drop h-[34vh] w-[23vh] rounded-2xl shadow-2xl"
            style={{ backgroundColor: yellow ? '#f5c518' : '#e11d2e' }}
          />
          <p className="text-[8vw] font-black leading-none lg:text-8xl">
            TARJETA {yellow ? 'AMARILLA' : 'ROJA'}
          </p>
          {b.player && <p className="text-4xl font-bold text-white/90 lg:text-5xl">{b.player}</p>}
          {teamName && <p className="text-2xl text-white/70 lg:text-3xl">{teamName}</p>}
        </div>
      </div>
    )
  }

  const st = STATE_BANNER[b.kind]
  return (
    <div className={`${wrap} ${st.bg} text-white`}>
      <div className="tv-pop flex flex-col items-center gap-4">
        <p className="text-[12vw] font-black leading-none lg:text-[9rem]">{st.title}</p>
        {b.score ? (
          <p className="text-4xl font-bold lg:text-5xl">{b.score}</p>
        ) : (
          <p className="text-3xl font-semibold lg:text-4xl">
            {b.homeName} vs {b.awayName}
          </p>
        )}
      </div>
    </div>
  )
}

/* ─────────────── tabla estilo TV ─────────────── */

const ROW_TINT: Record<Exclude<StandingStatus, 'neutral'>, string> = {
  direct: 'bg-ok-50 border-l-4 border-l-ok-600',
  best: 'bg-ok-50 border-l-4 border-l-ok-600',
  contention: 'bg-warn-50 border-l-4 border-l-warn-600',
  eliminated: 'bg-bad-50 border-l-4 border-l-bad-600',
}

function TvStandings({
  group,
  rows,
  statusByTeam,
  highlightIds,
  size = 'strip',
}: {
  group: Group
  rows: StandingWithTeam[]
  statusByTeam: Map<string, StandingStatus>
  highlightIds?: string[]
  size?: 'strip' | 'overlay'
}) {
  const ordered = [...rows].sort((a, b) => (a.position ?? 99) - (b.position ?? 99))
  const big = size === 'overlay'
  return (
    <div className="flex flex-col gap-2">
      <h3
        className={`font-black tracking-widest text-tinta uppercase ${
          big ? 'text-3xl' : 'text-lg'
        }`}
      >
        Grupo {group.name}
      </h3>
      <div className="overflow-hidden rounded-2xl border border-linea bg-panel">
        <table className={`w-full ${big ? 'text-2xl' : 'text-base'}`}>
          <thead>
            <tr
              className={`border-b border-linea text-tinta-3 uppercase ${
                big ? 'text-lg' : 'text-[11px]'
              }`}
            >
              <th className="w-10 px-2 py-2 text-center">#</th>
              <th className="px-2 py-2 text-left">Equipo</th>
              <th className="w-14 px-2 py-2 text-center">PJ</th>
              <th className="w-16 px-2 py-2 text-center">DG</th>
              <th className="w-16 px-2 py-2 text-center">PTS</th>
            </tr>
          </thead>
          <tbody>
            {ordered.map((row, i) => {
              const st = statusByTeam.get(row.team_id) ?? 'neutral'
              const tint = st !== 'neutral' ? ROW_TINT[st] : ''
              const hot = highlightIds?.includes(row.team_id)
              return (
                <tr
                  key={row.id}
                  className={`border-b border-linea last:border-0 ${tint} ${
                    hot ? 'ring-2 ring-inset ring-azul-600' : ''
                  }`}
                >
                  <td className="px-2 py-2 text-center font-bold text-tinta-3">
                    {row.position ?? i + 1}
                  </td>
                  <td className="px-2 py-2">
                    <TeamBadge team={row.team} size={big ? 'md' : 'sm'} />
                  </td>
                  <td className="px-2 py-2 text-center tabular-nums text-tinta-2">
                    {row.goal_diff > 0 ? '+' : ''}
                    {row.goal_diff}
                  </td>
                  <td className="px-2 py-2 text-center tabular-nums text-tinta-2">{row.played}</td>
                  <td className="px-2 py-2 text-center font-black tabular-nums text-tinta">
                    {row.points}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ─────────────── marcador ─────────────── */

function ScoreSide({ team }: { team: Team | null | undefined }) {
  const name = team?.name ?? 'Por definir'
  return (
    <div className="flex w-[26vw] max-w-sm flex-col items-center gap-4 text-center">
      {team?.logo_url ? (
        <img
          src={team.logo_url}
          alt={name}
          className="h-[13vw] max-h-44 w-[13vw] max-w-44 rounded-full object-cover"
        />
      ) : (
        <span
          className="flex h-[13vw] max-h-44 w-[13vw] max-w-44 items-center justify-center rounded-full text-6xl font-black text-white"
          style={{ backgroundColor: team?.color ?? '#0d3060' }}
        >
          {(team?.short_name ?? '?').slice(0, 3).toUpperCase()}
        </span>
      )}
      <span className="text-3xl font-black text-tinta lg:text-5xl">{name}</span>
    </div>
  )
}

function LiveScoreboard({
  match,
  clockLabel,
  periodLabel,
}: {
  match: MatchWithTeams
  clockLabel: string
  periodLabel: string
}) {
  return (
    <div className="flex flex-col items-center gap-10">
      <div className="flex items-center gap-3 text-xl font-black tracking-[0.3em] text-vino-600 uppercase">
        <Radio className="h-6 w-6 animate-pulse-live" />
        En vivo
        {isWomensMatch(match) && <CategoryBadge category={match.category} />}
      </div>
      <div className="flex items-center justify-center gap-8 lg:gap-16">
        <ScoreSide team={match.home_team} />
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-baseline gap-4 font-black text-tinta">
            <span className="text-[16vw] leading-none lg:text-[12rem]">{match.home_score}</span>
            <span className="text-[7vw] text-tinta-3 lg:text-7xl">–</span>
            <span className="text-[16vw] leading-none lg:text-[12rem]">{match.away_score}</span>
          </div>
          <span className="rounded-full bg-panel px-6 py-2 text-2xl font-bold text-tinta-2">
            {periodLabel}
          </span>
          <span className="font-mono text-6xl font-black text-vino-600 lg:text-8xl">
            {clockLabel}
          </span>
        </div>
        <ScoreSide team={match.away_team} />
      </div>
    </div>
  )
}

function UpcomingScoreboard({ match, now }: { match: MatchWithTeams; now: number }) {
  return (
    <div className="flex flex-col items-center gap-10">
      <div className="flex items-center gap-3 text-xl font-black tracking-[0.3em] text-azul-600 uppercase">
        Próximo partido
        {isWomensMatch(match) && <CategoryBadge category={match.category} />}
      </div>
      <div className="flex items-center justify-center gap-8 lg:gap-14">
        <ScoreSide team={match.home_team} />
        <span className="text-5xl font-bold text-tinta-3">vs</span>
        <ScoreSide team={match.away_team} />
      </div>
      <p className="font-mono text-7xl font-black text-azul-600 lg:text-9xl">
        {formatCountdown(match.scheduled_at, new Date(now))}
      </p>
    </div>
  )
}

function ChampionView({ team, finalMatch }: { team: Team; finalMatch: MatchWithTeams | undefined }) {
  const isHome = finalMatch?.home_team_id === team.id
  const gf = isHome ? finalMatch?.home_score : finalMatch?.away_score
  const ga = isHome ? finalMatch?.away_score : finalMatch?.home_score
  return (
    <div className="flex flex-col items-center gap-6">
      <span className="flex items-center gap-3 text-2xl font-black tracking-[0.3em] text-azul-600 uppercase">
        <Trophy className="h-7 w-7" />
        Campeón
      </span>
      {team.logo_url ? (
        <img src={team.logo_url} alt={team.name} className="h-64 w-64 rounded-full object-cover shadow-2xl" />
      ) : (
        <span
          className="flex h-64 w-64 items-center justify-center rounded-full text-8xl font-black text-white shadow-2xl"
          style={{ backgroundColor: team.color ?? '#0d3060' }}
        >
          {team.short_name.slice(0, 3).toUpperCase()}
        </span>
      )}
      <p className="text-[10vw] font-black leading-none text-tinta lg:text-9xl">{team.name}</p>
      {finalMatch?.status === 'FINALIZADO' && (
        <p className="text-3xl font-semibold text-tinta-2">
          Final {gf}–{ga}
        </p>
      )}
    </div>
  )
}

/* ─────────────── página ─────────────── */

export function TvPage() {
  const now = useNowMs()
  const rtHealthy = useRealtimeHealth()
  useWakeLock()

  const { tournament } = useTournament()
  const { matches, byGroup, groups, qualification, groupStageComplete, settings } = useQualification(
    tournament?.id,
  )
  const groupById = useMemo(() => new Map(groups.map((g) => [g.id, g])), [groups])

  const liveMatch = useMemo(
    () => matches.find((m) => m.status === 'EN_JUEGO' || m.status === 'DESCANSO') ?? null,
    [matches],
  )
  const nextMatch = useMemo(
    () =>
      matches
        .filter((m) => m.status === 'PROGRAMADO' || m.status === 'CALENTAMIENTO')
        .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0] ??
      null,
    [matches],
  )

  const clockLabel = useMemo(() => {
    if (!liveMatch || !settings) return ''
    return formatClock(elapsedNowSeconds(liveMatch, now)).replace('+', '')
  }, [liveMatch, settings, now])

  const championTeam = useMemo(() => {
    if (!tournament?.champion_team_id) return null
    return matches.flatMap((m) => [m.home_team, m.away_team]).find((t) => t?.id === tournament.champion_team_id) ?? null
  }, [tournament, matches])
  const finalMatch = useMemo(() => matches.find((m) => m.stage === 'FINAL'), [matches])

  /* --- banners: se disparan con los eventos del torneo (gol, tarjetas,
         inicio, descanso, 2.º tiempo, final). La tabla SOLO reaparece al
         final del partido, no en cada gol. --- */
  const { fresh, consume } = useTvEvents(tournament?.id)
  const [banners, setBanners] = useState<Banner[]>([])
  const [tableUntil, setTableUntil] = useState<{ until: number; groupId: string | null } | null>(null)
  const shownRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (fresh.length === 0) return
    const matchById = new Map(matches.map((m) => [m.id, m]))
    const add: Banner[] = []
    let finalOverlay: { until: number; groupId: string | null } | null = null

    for (const ev of fresh) {
      if (shownRef.current.has(ev.id)) continue
      shownRef.current.add(ev.id)
      const kind = EVENT_TO_KIND[ev.event_type]
      if (!kind) continue
      const m = matchById.get(ev.match_id)
      const team =
        ev.team_id && m
          ? m.home_team_id === ev.team_id
            ? m.home_team
            : m.away_team
          : null
      const hs = m?.home_team?.short_name ?? 'L'
      const as = m?.away_team?.short_name ?? 'V'
      add.push({
        id: ev.id,
        kind,
        team: team ?? null,
        player: ev.player_name,
        score: m ? `${hs} ${m.home_score} – ${m.away_score} ${as}` : null,
        homeName: m?.home_team?.name ?? 'Local',
        awayName: m?.away_team?.name ?? 'Visitante',
      })
      if (kind === 'final' && m) {
        finalOverlay = { until: Date.now() + 14000, groupId: m.group_id }
      }
    }

    // En microtask: reaccionamos a un stream externo (eventos), no a un render.
    if (add.length > 0 || finalOverlay) {
      const overlay = finalOverlay
      const batch = add
      queueMicrotask(() => {
        if (batch.length > 0) setBanners((b) => [...b, ...batch])
        if (overlay) setTableUntil(overlay)
      })
    }
    consume()
  }, [fresh, matches, consume])

  // Rotación de la cola de banners.
  useEffect(() => {
    if (banners.length === 0) return
    const t = setTimeout(() => setBanners((b) => b.slice(1)), BANNER_MS[banners[0].kind])
    return () => clearTimeout(t)
  }, [banners])

  const enPausa = !liveMatch && !championTeam && settings != null && isDuringBreak(settings, new Date(now))
  const banner = banners[0]
  // El overlay se cierra solo por comparación con `now` — no hace falta limpiar
  // `tableUntil` (un overlay nuevo lo sobrescribe).
  const showTableOverlay = tableUntil != null && now < tableUntil.until

  /* --- vista persistente --- */
  let persistent: ReactNode
  if (championTeam && tournament?.status === 'FINISHED') {
    persistent = <ChampionView team={championTeam} finalMatch={finalMatch} />
  } else if (liveMatch) {
    persistent = (
      <LiveScoreboard
        match={liveMatch}
        clockLabel={clockLabel}
        periodLabel={PERIOD_LABELS[liveMatch.current_period]}
      />
    )
  } else if (enPausa) {
    persistent = (
      <div className="flex flex-col items-center gap-6 text-center">
        <p className="text-[10vw] font-black leading-none text-vino-600 lg:text-9xl">DESCANSO</p>
        {settings?.break_end_time && (
          <p className="text-3xl text-tinta-2">Se reanuda {formatTimeOfDay(settings.break_end_time)}</p>
        )}
      </div>
    )
  } else if (nextMatch) {
    persistent = <UpcomingScoreboard match={nextMatch} now={now} />
  } else {
    persistent = (
      <div className="flex flex-col items-center gap-4 text-center">
        <img src={logo} alt="" className="h-32 w-32 object-contain" />
        <p className="text-5xl font-black text-tinta">{tournament?.name ?? 'Torneo'}</p>
        <p className="text-2xl text-tinta-3">Pronto</p>
      </div>
    )
  }

  // Franja de tablas: se ve cuando NO hay partido en vivo (entre partidos).
  const showStrip = !liveMatch && !showTableOverlay && !(championTeam && tournament?.status === 'FINISHED')

  return (
    <div translate="no" className="notranslate flex min-h-screen w-full flex-col bg-crema text-tinta">
      <Link
        to="/"
        className="fixed left-4 top-4 z-50 flex items-center gap-1.5 rounded-full border border-linea bg-panel/90 px-4 py-2 text-sm font-semibold text-tinta-2 shadow-sm hover:bg-panel"
      >
        <LogOut className="h-4 w-4" />
        Salir
      </Link>

      <div className="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-full border border-linea bg-panel/90 px-3 py-1.5 text-xs font-semibold shadow-sm">
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ${
            rtHealthy ? 'animate-pulse-live bg-ok-600' : 'bg-tinta-3'
          }`}
        />
        {rtHealthy ? 'EN VIVO' : 'Actualizando'}
      </div>

      <header className="flex items-center justify-center gap-4 border-b border-linea bg-panel/80 px-8 py-4">
        <img src={logo} alt="" className="h-10 w-10 object-contain" />
        <span className="text-2xl font-black tracking-tight">{tournament?.name ?? 'Torneo'}</span>
        <span className="font-mono text-xl font-bold text-tinta-2">
          {new Date(now).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </header>

      <main className="relative flex flex-1 flex-col items-center justify-center gap-10 px-6 py-10">
        {showTableOverlay ? (
          <OverlayTables
            tableUntil={tableUntil!}
            groups={groups}
            groupById={groupById}
            byGroup={byGroup}
            statusByTeam={qualification.statusByTeam}
            groupStageComplete={groupStageComplete}
            qualified={qualification.qualified}
            eliminated={qualification.eliminated}
          />
        ) : (
          persistent
        )}

        {showStrip && groups.length > 0 && (
          <section className="grid w-full max-w-6xl gap-4 md:grid-cols-3">
            {groups.map((g) => (
              <TvStandings
                key={g.id}
                group={g}
                rows={byGroup.get(g.id) ?? []}
                statusByTeam={qualification.statusByTeam}
              />
            ))}
          </section>
        )}
      </main>

      {banner && <EventBanner key={banner.id} b={banner} />}
    </div>
  )
}

function OverlayTables({
  tableUntil,
  groups,
  groupById,
  byGroup,
  statusByTeam,
  groupStageComplete,
  qualified,
  eliminated,
}: {
  tableUntil: { until: number; groupId: string | null }
  groups: Group[]
  groupById: Map<string, Group>
  byGroup: Map<string, StandingWithTeam[]>
  statusByTeam: Map<string, StandingStatus>
  groupStageComplete: boolean
  qualified: { standing: StandingWithTeam; label: string }[]
  eliminated: StandingWithTeam[]
}) {
  const grp = tableUntil.groupId ? groupById.get(tableUntil.groupId) : undefined

  if (grp) {
    return (
      <div className="w-full max-w-3xl">
        <TvStandings group={grp} rows={byGroup.get(grp.id) ?? []} statusByTeam={statusByTeam} size="overlay" />
      </div>
    )
  }

  if (groupStageComplete && qualified.length > 0) {
    return (
      <div className="flex w-full max-w-5xl flex-col gap-4">
        <h2 className="text-4xl font-black tracking-widest text-tinta uppercase">
          Clasificados a cuartos
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {qualified.map(({ standing, label }) => (
            <div
              key={standing.team_id}
              className="flex flex-col gap-1 rounded-xl border border-ok-600/40 bg-ok-50 px-4 py-3"
            >
              <span className="text-sm font-bold text-ok-700 uppercase">{label}</span>
              <TeamBadge team={standing.team} size="md" />
            </div>
          ))}
          {eliminated.map((s) => (
            <div
              key={s.team_id}
              className="flex flex-col gap-1 rounded-xl border border-bad-600/40 bg-bad-50 px-4 py-3"
            >
              <span className="text-sm font-bold text-bad-600 uppercase">Eliminado</span>
              <TeamBadge team={s.team} size="md" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <section className="grid w-full max-w-6xl gap-6 md:grid-cols-3">
      {groups.map((g) => (
        <TvStandings key={g.id} group={g} rows={byGroup.get(g.id) ?? []} statusByTeam={statusByTeam} />
      ))}
    </section>
  )
}
