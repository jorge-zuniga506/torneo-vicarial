import { useEffect, useId, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchStandings } from '../services/standings'
import type { StandingWithTeam } from '../types/tournament'

export function useStandings(tournamentId: string | undefined) {
  const [standings, setStandings] = useState<StandingWithTeam[]>([])
  const [loading, setLoading] = useState(true)

  const channelId = useId().replace(/\W/g, '')

  useEffect(() => {
    if (!tournamentId) return
    let activo = true

    const reload = () => fetchStandings(tournamentId).then((data) => activo && setStandings(data))
    reload().then(() => activo && setLoading(false))

    const channel = supabase
      .channel(`standings-${tournamentId}-${channelId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'standings', filter: `tournament_id=eq.${tournamentId}` },
        reload,
      )
      .subscribe()

    // Plan B: si el WebSocket de Realtime está bloqueado en esta red/dispositivo,
    // igual refrescamos cada 15 s (y al volver la conexión / la pestaña).
    const poll = window.setInterval(() => {
      if (document.visibilityState === 'visible') reload()
    }, 15000)
    const onOnline = () => reload()
    window.addEventListener('online', onOnline)

    return () => {
      activo = false
      window.clearInterval(poll)
      window.removeEventListener('online', onOnline)
      supabase.removeChannel(channel)
    }
  }, [tournamentId, channelId])

  const byGroup = new Map<string, StandingWithTeam[]>()
  for (const s of standings) {
    const list = byGroup.get(s.group_id) ?? []
    list.push(s)
    byGroup.set(s.group_id, list)
  }

  return { standings, byGroup, loading }
}
