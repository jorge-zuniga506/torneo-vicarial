import { useEffect, useId, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchMatches } from '../services/matches'
import type { MatchWithTeams } from '../types/tournament'

export function useMatches(tournamentId: string | undefined) {
  const [matches, setMatches] = useState<MatchWithTeams[]>([])
  const [loading, setLoading] = useState(true)
  // Sufijo único por instancia: el mismo hook puede usarse 2+ veces en un
  // árbol (p. ej. useLiveMatch + useQualification en /tv). Sin esto,
  // supabase.channel() devuelve el mismo canal y el 2.º .on() tras
  // .subscribe() tira "cannot add postgres_changes callbacks after subscribe()".
  const channelId = useId().replace(/\W/g, '')

  useEffect(() => {
    if (!tournamentId) return
    let activo = true

    const reload = () => fetchMatches(tournamentId).then((data) => activo && setMatches(data))
    reload().then(() => activo && setLoading(false))

    const channel = supabase
      .channel(`matches-${tournamentId}-${channelId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches', filter: `tournament_id=eq.${tournamentId}` },
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

  return { matches, loading }
}
