import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchMatches } from '../services/matches'
import type { MatchWithTeams } from '../types/tournament'

export function useMatches(tournamentId: string | undefined) {
  const [matches, setMatches] = useState<MatchWithTeams[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tournamentId) return
    let activo = true

    const reload = () => fetchMatches(tournamentId).then((data) => activo && setMatches(data))
    reload().then(() => activo && setLoading(false))

    const channel = supabase
      .channel(`matches-${tournamentId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches', filter: `tournament_id=eq.${tournamentId}` },
        reload,
      )
      .subscribe()

    return () => {
      activo = false
      supabase.removeChannel(channel)
    }
  }, [tournamentId])

  return { matches, loading }
}
