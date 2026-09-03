import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchRecentEvents } from '../services/tvEvents'
import type { TvEvent } from '../services/tvEvents'

/**
 * Eventos NUEVOS del torneo (desde que se montó el hook), para los banners de
 * `/tv`. Realtime + sondeo cada 10 s (plan B si el WebSocket está bloqueado).
 * Al montar siembra los ids ya existentes para no disparar un aluvión.
 */
export function useTvEvents(tournamentId: string | undefined) {
  const [fresh, setFresh] = useState<TvEvent[]>([])
  const seen = useRef<Set<string>>(new Set())
  const seeded = useRef(false)
  const channelId = useId().replace(/\W/g, '')

  useEffect(() => {
    if (!tournamentId) return
    let alive = true
    seeded.current = false
    seen.current = new Set()

    const pull = async () => {
      try {
        const rows = await fetchRecentEvents(tournamentId)
        if (!alive) return
        if (!seeded.current) {
          for (const r of rows) seen.current.add(r.id)
          seeded.current = true
          return
        }
        const nuevos = rows.filter((r) => !seen.current.has(r.id))
        if (nuevos.length === 0) return
        for (const r of nuevos) seen.current.add(r.id)
        // rows viene desc; los mostramos en orden cronológico
        setFresh((f) => [...f, ...nuevos.reverse()])
      } catch {
        /* silencioso: el sondeo reintenta */
      }
    }

    void pull()
    const channel = supabase
      .channel(`tv-events-${tournamentId}-${channelId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'match_events' },
        () => void pull(),
      )
      .subscribe()
    const poll = window.setInterval(() => {
      if (document.visibilityState === 'visible') void pull()
    }, 10000)
    const onOnline = () => void pull()
    window.addEventListener('online', onOnline)

    return () => {
      alive = false
      window.clearInterval(poll)
      window.removeEventListener('online', onOnline)
      supabase.removeChannel(channel)
    }
  }, [tournamentId, channelId])

  const consume = useCallback(() => setFresh([]), [])
  return { fresh, consume }
}
