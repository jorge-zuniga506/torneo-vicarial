import type { Group, StandingWithTeam, TournamentSettings } from '../types/tournament'

/**
 * Clasificación a cuartos, calculada solo desde `standings` (que Postgres ya
 * dejó ordenada con todos los desempates) + la config del torneo. No recalcula
 * nada: lee `position` y, para comparar los "mejores terceros" entre grupos,
 * ordena por PTS, DG, GF y `teams.manual_tiebreak`.
 *
 * Formato por defecto (tournament_settings): 2 por grupo (`qualifiers_per_group`)
 * + 2 mejores terceros (`best_third_places`) = 8 de 9; 1 eliminado.
 */

export interface QualificationSlot {
  standing: StandingWithTeam
  /** "1.º Grupo A", "Mejor 3.º", … */
  label: string
}

/**
 * Cómo va un equipo de cara a la clasificación:
 *  - `direct`      clasifica por posición en el grupo (verde)
 *  - `best`        clasifica como mejor tercero (verde, ya definido)
 *  - `contention`  está en la posición de repechaje pero la fase no terminó (ámbar)
 *  - `eliminated`  queda afuera (rojo)
 *  - `neutral`     nada que marcar todavía
 */
export type StandingStatus = 'direct' | 'best' | 'contention' | 'eliminated' | 'neutral'

export interface Qualification {
  /** Clasificados por posición dentro del grupo (posiciones 1..qualifiers_per_group). */
  directQualifiers: QualificationSlot[]
  /** Equipos en la posición límite (qualifiers_per_group + 1) ordenados del mejor al peor. */
  borderlineRanked: StandingWithTeam[]
  /** Los `best_third_places` mejores de esa posición límite: también clasifican. */
  bestBorderline: QualificationSlot[]
  /** Todos los clasificados (directos + mejores terceros), en orden de siembra. */
  qualified: QualificationSlot[]
  /** Equipo(s) de la posición límite que NO clasifican. */
  eliminated: StandingWithTeam[]
  /** Estado (semáforo) por equipo — para pintar las filas de la tabla. */
  statusByTeam: Map<string, StandingStatus>
  /** true cuando ya se jugaron todos los partidos de grupos y hay tabla completa. */
  ready: boolean
}

const ordinal = (n: number) => `${n}.º`

function byBorderlineRank(a: StandingWithTeam, b: StandingWithTeam): number {
  return (
    b.points - a.points ||
    b.goal_diff - a.goal_diff ||
    b.goals_for - a.goals_for ||
    (b.team?.manual_tiebreak ?? 0) - (a.team?.manual_tiebreak ?? 0) ||
    (a.team?.name ?? '').localeCompare(b.team?.name ?? '')
  )
}

export function computeQualification(
  standings: StandingWithTeam[],
  groups: Group[],
  settings: Pick<TournamentSettings, 'qualifiers_per_group' | 'best_third_places'> | null,
  groupStageComplete: boolean,
): Qualification {
  const perGroup = settings?.qualifiers_per_group ?? 0
  const bestCount = settings?.best_third_places ?? 0
  const groupOrder = new Map(groups.map((g, i) => [g.id, g.display_order ?? i]))
  const groupName = new Map(groups.map((g) => [g.id, g.name]))

  const sortByGroup = (a: StandingWithTeam, b: StandingWithTeam) =>
    (groupOrder.get(a.group_id) ?? 0) - (groupOrder.get(b.group_id) ?? 0)

  const atPosition = (pos: number) =>
    standings.filter((s) => s.position === pos)

  const directQualifiers: QualificationSlot[] = []
  for (let pos = 1; pos <= perGroup; pos++) {
    for (const s of atPosition(pos).sort(sortByGroup)) {
      directQualifiers.push({
        standing: s,
        label: `${ordinal(pos)} Grupo ${groupName.get(s.group_id) ?? ''}`.trim(),
      })
    }
  }

  const borderlineRanked = atPosition(perGroup + 1).sort(byBorderlineRank)
  const bestBorderline: QualificationSlot[] = borderlineRanked.slice(0, bestCount).map((s, i) => ({
    standing: s,
    label: bestCount > 1 ? `${i === 0 ? 'Mejor' : `${ordinal(i + 1)} mejor`} ${ordinal(perGroup + 1)}` : `Mejor ${ordinal(perGroup + 1)}`,
  }))
  const eliminated = borderlineRanked.slice(bestCount)

  const expectedDirect = perGroup * groups.length
  const ready =
    groupStageComplete &&
    groups.length > 0 &&
    directQualifiers.length === expectedDirect &&
    borderlineRanked.length === groups.length

  // Semáforo por equipo.
  const statusByTeam = new Map<string, StandingStatus>()
  for (const s of standings) {
    const pos = s.position ?? 99
    let status: StandingStatus
    if (pos <= perGroup) {
      status = 'direct'
    } else if (ready) {
      // fase terminada: la posición límite se resuelve en mejores terceros / eliminado
      if (bestBorderline.some((b) => b.standing.team_id === s.team_id)) status = 'best'
      else status = 'eliminated'
    } else if (pos === perGroup + 1) {
      status = 'contention'
    } else {
      status = 'eliminated'
    }
    statusByTeam.set(s.team_id, status)
  }

  return {
    directQualifiers,
    borderlineRanked,
    bestBorderline,
    qualified: [...directQualifiers, ...bestBorderline],
    eliminated,
    statusByTeam,
    ready,
  }
}
