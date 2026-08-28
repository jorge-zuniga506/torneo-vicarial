import type { TournamentSettings } from '../types/tournament'

function timeStringToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

/** true si "ahora" cae dentro de la pausa obligatoria del torneo (ej. 3:00–3:50pm). */
export function isDuringBreak(settings: TournamentSettings, now = new Date()): boolean {
  if (!settings.break_start_time || !settings.break_end_time) return false
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const start = timeStringToMinutes(settings.break_start_time)
  const end = timeStringToMinutes(settings.break_end_time)
  return nowMinutes >= start && nowMinutes < end
}

export function formatTimeOfDay(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

export function formatCountdown(targetIso: string, now = new Date()): string {
  const diffMs = new Date(targetIso).getTime() - now.getTime()
  if (diffMs <= 0) return '00:00'
  const totalSeconds = Math.floor(diffMs / 1000)
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
