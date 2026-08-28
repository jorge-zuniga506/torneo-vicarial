import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

type Supabase = SupabaseClient<Database>
type TeamInsert = Database['public']['Tables']['teams']['Insert']
type TeamUpdate = Database['public']['Tables']['teams']['Update']

export async function listTeams(supabase: Supabase, tournamentId?: string) {
  let query = supabase.from('teams').select('*, players!players_team_id_fkey(*)').order('short_name')
  if (tournamentId) query = query.eq('tournament_id', tournamentId)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getTeam(supabase: Supabase, id: string) {
  const { data, error } = await supabase
    .from('teams')
    .select('*, players!players_team_id_fkey(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createTeam(supabase: Supabase, input: TeamInsert) {
  const { data, error } = await supabase.from('teams').insert(input).select().single()
  if (error) throw error
  return data
}

export async function updateTeam(supabase: Supabase, id: string, input: TeamUpdate) {
  const { data, error } = await supabase
    .from('teams')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteTeam(supabase: Supabase, id: string) {
  const { error } = await supabase.from('teams').delete().eq('id', id)
  if (error) throw error
}
