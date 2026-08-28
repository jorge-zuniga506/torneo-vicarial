import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchPlayerStats } from '../services/playerStats'
import type { PlayerStatsRow } from '../services/playerStats'

/**
 * Estadísticas de jugadores del torneo, en vivo. Se refresca ante cualquier
 * cambio en `match_events` (un gol, una tarjeta) porque la vista
 * `player_stats` se arma sobre esa tabla.
 */
export function usePlayerStats(tournamentId: string | undefined) {
  const [stats, setStats] = useState<PlayerStatsRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tournamentId) return
    let activo = true

    const reload = () => fetchPlayerStats(tournamentId).then((data) => activo && setStats(data))
    reload().then(() => activo && setLoading(false))

    const channel = supabase
      .channel(`player-stats-${tournamentId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_events' }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, reload)
      .subscribe()

    return () => {
      activo = false
      supabase.removeChannel(channel)
    }
  }, [tournamentId])

  const topScorers = [...stats]
    .filter((s) => (s.goals ?? 0) > 0)
    .sort((a, b) => (b.goals ?? 0) - (a.goals ?? 0) || (b.assists ?? 0) - (a.assists ?? 0))

  const topAssists = [...stats]
    .filter((s) => (s.assists ?? 0) > 0)
    .sort((a, b) => (b.assists ?? 0) - (a.assists ?? 0))

  return { stats, topScorers, topAssists, loading }
}
