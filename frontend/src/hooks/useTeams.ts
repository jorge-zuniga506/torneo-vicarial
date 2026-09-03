import { useEffect, useId, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchTeams } from '../services/teams'
import type { Team } from '../types/tournament'

export function useTeams(tournamentId: string | undefined) {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)

  const channelId = useId().replace(/\W/g, '')

  useEffect(() => {
    if (!tournamentId) return
    let activo = true

    const reload = () => fetchTeams(tournamentId).then((data) => activo && setTeams(data))
    reload().then(() => activo && setLoading(false))

    const channel = supabase
      .channel(`teams-${tournamentId}-${channelId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'teams', filter: `tournament_id=eq.${tournamentId}` },
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

  return { teams, loading }
}
