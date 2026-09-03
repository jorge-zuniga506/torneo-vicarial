import { useMemo } from 'react'
import { useStandings } from './useStandings'
import { useGroups } from './useGroups'
import { useMatches } from './useMatches'
import { useTournament } from './useTournament'
import { computeQualification } from '../utils/qualifiers'
import { isWomensMatch } from '../utils/matchLabels'
import type { MatchWithTeams } from '../types/tournament'

/** true si ya se jugaron todos los partidos de fase de grupos masculinos. */
export function groupStageDone(matches: MatchWithTeams[]): boolean {
  const groupMatches = matches.filter((m) => m.stage === 'GROUP' && !isWomensMatch(m))
  return groupMatches.length > 0 && groupMatches.every((m) => m.status === 'FINALIZADO')
}

/**
 * Clasificación a cuartos en vivo: clasificados, mejores terceros y eliminado.
 * Todo sale de `standings` (ya ordenada por Postgres) + la config del torneo.
 */
export function useQualification(tournamentId: string | undefined) {
  const { tournament, settings } = useTournament()
  const { standings, loading: loadingStandings } = useStandings(tournamentId)
  const { groups, loading: loadingGroups } = useGroups(tournamentId)
  const { matches, loading: loadingMatches } = useMatches(tournamentId)

  const complete = useMemo(() => groupStageDone(matches), [matches])

  const qualification = useMemo(
    () => computeQualification(standings, groups, settings, complete),
    [standings, groups, settings, complete],
  )

  const byGroup = useMemo(() => {
    const map = new Map<string, typeof standings>()
    for (const s of standings) {
      const list = map.get(s.group_id) ?? []
      list.push(s)
      map.set(s.group_id, list)
    }
    return map
  }, [standings])

  return {
    qualification,
    groupStageComplete: complete,
    tournament,
    standings,
    byGroup,
    groups,
    matches,
    settings,
    loading: loadingStandings || loadingGroups || loadingMatches,
  }
}
