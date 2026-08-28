import { useEffect, useState } from 'react'
import { fetchActiveTournament } from '../services/tournament'
import type { Tournament, TournamentSettings } from '../types/tournament'

export function useTournament() {
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [settings, setSettings] = useState<TournamentSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let activo = true
    fetchActiveTournament().then((result) => {
      if (!activo) return
      setTournament(result?.tournament ?? null)
      setSettings(result?.settings ?? null)
      setLoading(false)
    })
    return () => {
      activo = false
    }
  }, [])

  return { tournament, settings, loading }
}
