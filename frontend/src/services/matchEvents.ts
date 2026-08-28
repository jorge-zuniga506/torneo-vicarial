import { supabase } from '../lib/supabase'
import type { MatchEvent } from '../types/tournament'

export interface MatchEventWithPlayer extends MatchEvent {
  player: { id: string; name: string } | null
  assist_player: { id: string; name: string } | null
}

export async function fetchMatchEvents(matchId: string): Promise<MatchEventWithPlayer[]> {
  const { data, error } = await supabase
    .from('match_events')
    .select('*, player:players!match_events_player_id_fkey(id, name), assist_player:players!match_events_assist_player_id_fkey(id, name)')
    .eq('match_id', matchId)
    .order('occurred_at', { ascending: false })
  if (error) throw error
  return data as unknown as MatchEventWithPlayer[]
}
