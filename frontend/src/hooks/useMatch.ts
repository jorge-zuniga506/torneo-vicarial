import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchMatchById } from '../services/matches'
import type { MatchWithTeams } from '../types/tournament'

/** Un partido por id, con equipos, en tiempo real (para el control en vivo). */
export function useMatch(matchId: string | undefined) {
  const [match, setMatch] = useState<MatchWithTeams | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)

  /** Fuerza una relectura inmediata (no dependemos solo de Realtime). */
  const refetch = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => {
    if (!matchId) return
    let activo = true

    const reload = () =>
      fetchMatchById(matchId)
        .then((data) => {
          if (!activo) return
          setMatch(data)
          setError(null)
        })
        .catch((e) => {
          if (activo) setError(e instanceof Error ? e.message : 'No se pudo cargar')
        })

    reload().then(() => activo && setLoading(false))

    const channel = supabase
      .channel(`match-${matchId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` },
        reload,
      )
      .subscribe()

    return () => {
      activo = false
      supabase.removeChannel(channel)
    }
  }, [matchId, nonce])

  return { match, loading, error, refetch }
}
