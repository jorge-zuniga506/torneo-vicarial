import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

type Supabase = SupabaseClient<Database>

export async function listStandings(supabase: Supabase, tournamentId: string) {
  const { data, error } = await supabase
    .from('standings')
    .select('*, team:teams(*)')
    .eq('tournament_id', tournamentId)
    .order('group_id')
    .order('position')
  if (error) throw error
  return data
}
