import { supabase } from '../lib/supabase'
import type { Group } from '../types/tournament'

export async function fetchGroups(tournamentId: string): Promise<Group[]> {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('display_order')
  if (error) throw error
  return data
}
