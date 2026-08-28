import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchMatchEvents } from '../services/matchEvents'
import type { MatchEventWithPlayer } from '../services/matchEvents'

export function useMatchEvents(matchId: string | undefined) {
  const [events, setEvents] = useState<MatchEventWithPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [nonce, setNonce] = useState(0)

  const refetch = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => {
    if (!matchId) return
    let activo = true

    const reload = () =>
      fetchMatchEvents(matchId).then((data) => activo && setEvents(data))

    reload().then(() => activo && setLoading(false))

    const channel = supabase
      .channel(`match-events-${matchId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'match_events', filter: `match_id=eq.${matchId}` },
        reload,
      )
      .subscribe()

    return () => {
      activo = false
      supabase.removeChannel(channel)
    }
  }, [matchId, nonce])

  return { events, loading, refetch }
}
