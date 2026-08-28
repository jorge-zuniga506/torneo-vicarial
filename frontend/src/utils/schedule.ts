import type { TournamentSettings } from '../types/tournament'

const pad = (n: number) => String(n).padStart(2, '0')

/** Parte de fecha local ("2026-08-28") de un timestamp ISO. */
export function localDatePart(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Minutos desde medianoche de un `time` tipo "15:00:00". */
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export interface SlotInput {
  id: string
  scheduled_at: string
}

export interface SlotResult {
  id: string
  scheduled_at: string
  /** minutos desde medianoche del horario asignado */
  minute: number
  /** true si se empujó por caer dentro de la pausa */
  bumpedByBreak: boolean
}

/**
 * Recalcula los horarios de una lista YA ORDENADA de partidos: el primero
 * arranca en `tournament_start_time` y cada siguiente sale `slotMinutes`
 * después. Un partido que caería dentro de la pausa se corre a
 * `break_end_time`. Devuelve el horario de cada uno, en el mismo orden.
 */
export function planSchedule(
  ordered: SlotInput[],
  settings: TournamentSettings,
  dateStr: string,
  slotMinutes = settings.slot_minutes || 15,
): SlotResult[] {
  const base = new Date(`${dateStr}T00:00:00`).getTime()
  const start = timeToMinutes(settings.tournament_start_time)
  const bStart = settings.break_start_time ? timeToMinutes(settings.break_start_time) : null
  const bEnd = settings.break_end_time ? timeToMinutes(settings.break_end_time) : null

  let cursor = start
  return ordered.map((m) => {
    let bumped = false
    if (bStart != null && bEnd != null && cursor >= bStart && cursor < bEnd) {
      cursor = bEnd
      bumped = true
    }
    const scheduled_at = new Date(base + cursor * 60_000).toISOString()
    const result: SlotResult = { id: m.id, scheduled_at, minute: cursor, bumpedByBreak: bumped }
    cursor += slotMinutes
    return result
  })
}

/** Solo los partidos cuyo horario cambió respecto del actual. */
export function scheduleChanges(
  ordered: SlotInput[],
  settings: TournamentSettings,
  dateStr: string,
  slotMinutes?: number,
): { id: string; scheduled_at: string }[] {
  const current = new Map(ordered.map((m) => [m.id, new Date(m.scheduled_at).toISOString()]))
  return planSchedule(ordered, settings, dateStr, slotMinutes)
    .filter((r) => current.get(r.id) !== r.scheduled_at)
    .map((r) => ({ id: r.id, scheduled_at: r.scheduled_at }))
}
