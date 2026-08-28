import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchPlayersByTournament } from '../services/players'
import type { PlayerTeamRef } from '../services/players'
import type { Player } from '../types/tournament'

export type PlayerWithTeam = Player & { team: PlayerTeamRef | null }

/** Todos los jugadores del torneo (con su equipo), en tiempo real. */
export function useTournamentPlayers(tournamentId: string | undefined) {
  const [players, setPlayers] = useState<PlayerWithTeam[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tournamentId) return
    let activo = true

    const reload = () =>
      fetchPlayersByTournament(tournamentId).then((data) => activo && setPlayers(data))
    reload().then(() => activo && setLoading(false))

    const channel = supabase
      .channel(`tournament-players-${tournamentId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, reload)
      .subscribe()

    return () => {
      activo = false
      supabase.removeChannel(channel)
    }
  }, [tournamentId])

  return { players, loading }
}
