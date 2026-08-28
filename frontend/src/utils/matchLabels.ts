import type { MatchStatus, MatchStage } from '../types/tournament'

export const STATUS_LABELS: Record<MatchStatus, string> = {
  PROGRAMADO: 'Programado',
  CALENTAMIENTO: 'Calentamiento',
  EN_JUEGO: 'En juego',
  DESCANSO: 'Descanso',
  FINALIZADO: 'Finalizado',
  SUSPENDIDO: 'Suspendido',
  CANCELADO: 'Cancelado',
}

/** Clases Tailwind para el pill de estado de un partido. */
export const STATUS_PILL: Record<MatchStatus, string> = {
  PROGRAMADO: 'bg-crema text-tinta-3 border border-linea',
  CALENTAMIENTO: 'bg-azul-50 text-azul-600 border border-azul-200',
  EN_JUEGO: 'bg-vino-50 text-vino-600 border border-vino-400/50 animate-pulse-live',
  DESCANSO: 'bg-vino-50 text-vino-500 border border-vino-100',
  FINALIZADO: 'bg-crema text-tinta-2 border border-linea',
  SUSPENDIDO: 'bg-viol-100 text-viol-600 border border-viol-500/30',
  CANCELADO: 'bg-crema text-tinta-3 border border-linea line-through',
}

export const STAGE_LABELS: Record<MatchStage, string> = {
  GROUP: 'Fase de grupos',
  QUARTERFINAL: 'Cuartos de final',
  SEMIFINAL: 'Semifinal',
  FINAL: 'Final',
  THIRD_PLACE: 'Tercer puesto',
}

export const STAGE_LABELS_SHORT: Record<MatchStage, string> = {
  GROUP: 'Grupos',
  QUARTERFINAL: 'Cuartos',
  SEMIFINAL: 'Semis',
  FINAL: 'Final',
  THIRD_PLACE: '3.º puesto',
}

export const LIVE_STATUSES: MatchStatus[] = ['CALENTAMIENTO', 'EN_JUEGO', 'DESCANSO']

export function isLive(status: MatchStatus): boolean {
  return LIVE_STATUSES.includes(status)
}

export function formatKickoff(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' })
}

export function formatKickoffDay(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })
}
