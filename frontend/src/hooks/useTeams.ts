import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchTeams } from '../services/teams'
import type { Team } from '../types/tournament'

export function useTeams(tournamentId: string | undefined) {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tournamentId) return
    let activo = true

    const reload = () => fetchTeams(tournamentId).then((data) => activo && setTeams(data))
    reload().then(() => activo && setLoading(false))

    const channel = supabase
      .channel(`teams-${tournamentId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'teams', filter: `tournament_id=eq.${tournamentId}` },
        reload,
      )
      .subscribe()

    return () => {
      activo = false
      supabase.removeChannel(channel)
    }
  }, [tournamentId])

  return { teams, loading }
}
