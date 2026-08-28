import { useEffect, useState } from 'react'
import { useMatches } from './useMatches'
import { useTournament } from './useTournament'
import {
  elapsedNowSeconds,
  formatClock,
  periodDurationSeconds,
  remainingSeconds,
} from '../utils/matchClock'

/**
 * Deriva el partido en vivo y el próximo partido a partir de useMatches, y
 * mantiene un reloj `now` que avanza cada segundo para que el cronómetro
 * corra sin recargar. El tiempo en sí NUNCA se suma localmente — sale de
 * started_at + elapsed_seconds (ver utils/matchClock) evaluados en `now`,
 * así todos los espectadores ven aproximadamente lo mismo.
 */
export function useLiveMatch(tournamentId: string | undefined) {
  const { matches, loading } = useMatches(tournamentId)
  const { settings } = useTournament()
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

  const liveMatch = matches.find((m) => m.status === 'EN_JUEGO' || m.status === 'DESCANSO') ?? null

  const nextMatch =
    matches
      .filter((m) => m.status === 'PROGRAMADO')
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0] ??
    null

  const recentlyFinished = matches
    .filter((m) => m.status === 'FINALIZADO')
    .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())

  const clock =
    liveMatch && settings
      ? {
          remainingSeconds: remainingSeconds(liveMatch, settings, now),
          elapsedSeconds: elapsedNowSeconds(liveMatch, now),
          durationSeconds: periodDurationSeconds(liveMatch, settings),
          label: formatClock(remainingSeconds(liveMatch, settings, now)),
        }
      : null

  return { matches, liveMatch, nextMatch, recentlyFinished, clock, loading }
}
