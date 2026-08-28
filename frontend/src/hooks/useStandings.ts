import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchStandings } from '../services/standings'
import type { StandingWithTeam } from '../types/tournament'

export function useStandings(tournamentId: string | undefined) {
  const [standings, setStandings] = useState<StandingWithTeam[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tournamentId) return
    let activo = true

    const reload = () => fetchStandings(tournamentId).then((data) => activo && setStandings(data))
    reload().then(() => activo && setLoading(false))

    const channel = supabase
      .channel(`standings-${tournamentId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'standings', filter: `tournament_id=eq.${tournamentId}` },
        reload,
      )
      .subscribe()

    return () => {
      activo = false
      supabase.removeChannel(channel)
    }
  }, [tournamentId])

  const byGroup = new Map<string, StandingWithTeam[]>()
  for (const s of standings) {
    const list = byGroup.get(s.group_id) ?? []
    list.push(s)
    byGroup.set(s.group_id, list)
  }

  return { standings, byGroup, loading }
}
