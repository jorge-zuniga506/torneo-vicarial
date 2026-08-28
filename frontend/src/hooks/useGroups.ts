import { useEffect, useState } from 'react'
import { fetchGroups } from '../services/groups'
import type { Group } from '../types/tournament'

/**
 * Grupos del torneo. No están en la publicación de Realtime (casi nunca
 * cambian una vez armado el torneo), así que es una lectura única. Si un
 * equipo cambia de grupo eso viaja por la tabla `teams`, que sí es realtime
 * (ver useTeams), no por acá.
 */
export function useGroups(tournamentId: string | undefined) {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tournamentId) return
    let activo = true
    fetchGroups(tournamentId)
      .then((data) => activo && setGroups(data))
      .finally(() => activo && setLoading(false))
    return () => {
      activo = false
    }
  }, [tournamentId])

  const byId = new Map(groups.map((g) => [g.id, g]))
  return { groups, byId, loading }
}
