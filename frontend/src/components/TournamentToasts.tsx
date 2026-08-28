import { useTournament } from '../hooks/useTournament'
import { useTournamentToasts } from '../hooks/useTournamentToasts'

/**
 * Monta el listener de notificaciones una sola vez, a nivel app. No pinta
 * nada; los toasts los renderiza <Toaster/> de sonner (ver main.tsx).
 */
export function TournamentToasts() {
  const { tournament } = useTournament()
  useTournamentToasts(tournament?.id)
  return null
}
