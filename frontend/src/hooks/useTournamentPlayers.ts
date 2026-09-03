import { useEffect, useId, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchPlayersByTournament } from '../services/players'
import type { PlayerTeamRef } from '../services/players'
import type { Player } from '../types/tournament'

export type PlayerWithTeam = Player & { team: PlayerTeamRef | null }

/** Todos los jugadores del torneo (con su equipo), en tiempo real. */
export function useTournamentPlayers(tournamentId: string | undefined) {
  const [players, setPlayers] = useState<PlayerWithTeam[]>([])
  const [loading, setLoading] = useState(true)

  const channelId = useId().replace(/\W/g, '')

  useEffect(() => {
    if (!tournamentId) return
    let activo = true

    const reload = () =>
      fetchPlayersByTournament(tournamentId).then((data) => activo && setPlayers(data))
    reload().then(() => activo && setLoading(false))

    const channel = supabase
      .channel(`tournament-players-${tournamentId}-${channelId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, reload)
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

  return { players, loading }
}
