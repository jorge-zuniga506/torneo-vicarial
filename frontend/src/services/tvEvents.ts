import { supabase } from '../lib/supabase'
import type { EventType } from '../types/tournament'

export interface TvEvent {
  id: string
  match_id: string
  event_type: EventType
  created_at: string
  team_id: string | null
  player_name: string | null
}

/**
 * Los ~40 eventos más recientes del torneo (goles, tarjetas, inicio, descanso,
 * 2.º tiempo, final), con el nombre del jugador. Se usa en `/tv` para los
 * banners; RLS deja leer `match_events` en público.
 */
export async function fetchRecentEvents(tournamentId: string): Promise<TvEvent[]> {
  const { data, error } = await supabase
    .from('match_events')
    .select(
      'id, match_id, event_type, created_at, team_id, ' +
        'player:players!match_events_player_id_fkey(name), ' +
        'match:matches!match_events_match_id_fkey!inner(tournament_id)',
    )
    .eq('match.tournament_id', tournamentId)
    .order('created_at', { ascending: false })
    .limit(40)
  if (error) throw error

  return (data ?? []).map((r) => {
    const rec = r as unknown as {
      id: string
      match_id: string
      event_type: EventType
      created_at: string
      team_id: string | null
      player: { name: string } | { name: string }[] | null
    }
    const player = Array.isArray(rec.player) ? rec.player[0] : rec.player
    return {
      id: rec.id,
      match_id: rec.match_id,
      event_type: rec.event_type,
      created_at: rec.created_at,
      team_id: rec.team_id,
      player_name: player?.name ?? null,
    }
  })
}
