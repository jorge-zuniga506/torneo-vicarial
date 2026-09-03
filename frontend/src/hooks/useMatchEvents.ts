import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchMatchEvents } from '../services/matchEvents'
import type { MatchEventWithPlayer } from '../services/matchEvents'

export function useMatchEvents(matchId: string | undefined) {
  const [events, setEvents] = useState<MatchEventWithPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const aliveRef = useRef(true)

  const reload = useCallback(async () => {
    if (!matchId) return
    try {
      const data = await fetchMatchEvents(matchId)
      if (aliveRef.current) setEvents(data)
    } catch {
      // silencioso: el feed de eventos no es crítico
    } finally {
      if (aliveRef.current) setLoading(false)
    }
  }, [matchId])

  useEffect(() => {
    if (!matchId) return
    aliveRef.current = true
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial
    reload()

    const channel = supabase
      .channel(`match-events-${matchId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'match_events', filter: `match_id=eq.${matchId}` },
        () => {
          reload()
        },
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
      aliveRef.current = false
      window.clearInterval(poll)
      window.removeEventListener('online', onOnline)
      supabase.removeChannel(channel)
    }
  }, [matchId, reload])

  return { events, loading, refetch: reload }
}
