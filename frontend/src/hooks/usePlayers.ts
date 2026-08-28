import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchPlayersByTeam } from '../services/players'
import type { Player } from '../types/tournament'

/** Plantel de un equipo, en tiempo real (la tabla `players` está en la publicación de Realtime). */
export function usePlayers(teamId: string | undefined) {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!teamId) return
    let activo = true

    const reload = () => fetchPlayersByTeam(teamId).then((data) => activo && setPlayers(data))
    reload().then(() => activo && setLoading(false))

    const channel = supabase
      .channel(`players-team-${teamId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players', filter: `team_id=eq.${teamId}` },
        reload,
      )
      .subscribe()

    return () => {
      activo = false
      supabase.removeChannel(channel)
    }
  }, [teamId])

  return { players, loading }
}
