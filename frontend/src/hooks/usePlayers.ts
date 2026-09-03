import { useEffect, useId, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchPlayersByTeam } from '../services/players'
import type { Player } from '../types/tournament'

/** Plantel de un equipo, en tiempo real (la tabla `players` está en la publicación de Realtime). */
export function usePlayers(teamId: string | undefined) {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  const channelId = useId().replace(/\W/g, '')

  useEffect(() => {
    if (!teamId) return
    let activo = true

    const reload = () => fetchPlayersByTeam(teamId).then((data) => activo && setPlayers(data))
    reload().then(() => activo && setLoading(false))

    const channel = supabase
      .channel(`players-team-${teamId}-${channelId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players', filter: `team_id=eq.${teamId}` },
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
  }, [teamId, channelId])

  return { players, loading }
}
