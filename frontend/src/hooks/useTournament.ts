import { useCallback, useEffect, useState } from 'react'
import { fetchActiveTournament } from '../services/tournament'
import type { Tournament, TournamentSettings } from '../types/tournament'

export function useTournament() {
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [settings, setSettings] = useState<TournamentSettings | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const result = await fetchActiveTournament()
      setTournament(result?.tournament ?? null)
      setSettings(result?.settings ?? null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let activo = true
    const reload = () => {
      if (activo && document.visibilityState === 'visible') void load()
    }
    void load()
    // `tournaments` no está en la publicación de Realtime: refrescamos por
    // sondeo para que estado / campeón se actualicen sin recargar la página.
    const poll = window.setInterval(reload, 20000)
    window.addEventListener('online', reload)
    document.addEventListener('visibilitychange', reload)
    return () => {
      activo = false
      window.clearInterval(poll)
      window.removeEventListener('online', reload)
      document.removeEventListener('visibilitychange', reload)
    }
  }, [load])

  return { tournament, settings, loading, refetch: load }
}
