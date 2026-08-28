import type { Match, TournamentSettings } from '../types/tournament'

/** Duración reglamentaria (segundos) del período actual del partido. */
export function periodDurationSeconds(match: Match, settings: TournamentSettings): number {
  switch (match.current_period) {
    case 'FIRST_HALF':
      return settings.first_half_minutes * 60
    case 'HALFTIME':
      return settings.halftime_minutes * 60
    case 'SECOND_HALF':
      return settings.second_half_minutes * 60
    default:
      return 0
  }
}

/**
 * Segundos transcurridos del período actual, evaluados en `now` (ms epoch;
 * por defecto Date.now()). Se basa en started_at + elapsed_seconds (ambos
 * vienen de la base) — NO en un contador local — así todos los espectadores
 * calculan aproximadamente lo mismo. Pasar `now` desde un estado que avanza
 * cada segundo hace que el componente re-renderice y el reloj corra.
 */
export function elapsedNowSeconds(match: Match, now: number = Date.now()): number {
  if (!match.started_at) return match.elapsed_seconds
  const runningFor = (now - new Date(match.started_at).getTime()) / 1000
  return match.elapsed_seconds + Math.max(runningFor, 0)
}

/** Segundos restantes del período actual (negativo = tiempo agregado/cumplido). */
export function remainingSeconds(
  match: Match,
  settings: TournamentSettings,
  now: number = Date.now(),
): number {
  return periodDurationSeconds(match, settings) - elapsedNowSeconds(match, now)
}

export function formatClock(totalSeconds: number): string {
  const sign = totalSeconds < 0 ? '+' : ''
  const abs = Math.abs(Math.round(totalSeconds))
  const m = Math.floor(abs / 60)
  const s = abs % 60
  return `${sign}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * Minuto de juego "para mostrar" en un evento (gol/tarjeta): acumula el
 * primer tiempo cuando ya se juega el segundo. Devuelve null fuera de juego.
 */
export function currentMatchMinute(
  match: Match,
  settings: TournamentSettings,
  now: number = Date.now(),
): number | null {
  const mins = Math.floor(elapsedNowSeconds(match, now) / 60)
  if (match.current_period === 'FIRST_HALF') return mins + 1
  if (match.current_period === 'SECOND_HALF') return settings.first_half_minutes + mins + 1
  return null
}

export const PERIOD_LABELS: Record<Match['current_period'], string> = {
  PRE: 'Por comenzar',
  FIRST_HALF: '1er tiempo',
  HALFTIME: 'Descanso',
  SECOND_HALF: '2do tiempo',
  ENDED: 'Finalizado',
}
