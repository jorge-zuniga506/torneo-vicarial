import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchMatchById } from '../services/matches'
import type { MatchWithTeams } from '../types/tournament'

/** Un partido por id, con equipos, en tiempo real (para el control en vivo). */
export function useMatch(matchId: string | undefined) {
  const [match, setMatch] = useState<MatchWithTeams | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const aliveRef = useRef(true)

  /** Relee el partido ya. No toca la suscripción de Realtime. */
  const reload = useCallback(async () => {
    if (!matchId) return
    try {
      const data = await fetchMatchById(matchId)
      if (aliveRef.current) {
        setMatch(data)
        setError(null)
      }
    } catch (e) {
      if (aliveRef.current) setError(e instanceof Error ? e.message : 'No se pudo cargar el partido')
    } finally {
      if (aliveRef.current) setLoading(false)
    }
  }, [matchId])

  const channelId = useId().replace(/\W/g, '')

  useEffect(() => {
    if (!matchId) return
    aliveRef.current = true
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial
    reload()

    const channel = supabase
      .channel(`match-${matchId}-${channelId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` },
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
  }, [matchId, reload, channelId])

  return { match, loading, error, refetch: reload }
}
