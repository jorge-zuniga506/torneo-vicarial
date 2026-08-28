import { supabase } from '../lib/supabase'
import type { StandingWithTeam } from '../types/tournament'

export async function fetchStandings(tournamentId: string): Promise<StandingWithTeam[]> {
  const { data, error } = await supabase
    .from('standings')
    .select('*, team:teams(*)')
    .eq('tournament_id', tournamentId)
    .order('group_id')
    .order('position')
  if (error) throw error
  return data as unknown as StandingWithTeam[]
}
