import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

type Supabase = SupabaseClient<Database>
type PlayerInsert = Database['public']['Tables']['players']['Insert']
type PlayerUpdate = Database['public']['Tables']['players']['Update']

export async function listPlayers(supabase: Supabase, teamId?: string) {
  let query = supabase.from('players').select('*').order('jersey_number')
  if (teamId) query = query.eq('team_id', teamId)
  const { data: players, error } = await query
  if (error) throw error
  if (!players || players.length === 0) return []

  // player_stats es una vista sin FK real hacia players (player_id no es
  // una columna FK, se calcula), así que PostgREST no puede embeberla
  // automáticamente — se trae aparte y se mergea acá.
  const { data: stats, error: statsError } = await supabase
    .from('player_stats')
    .select('*')
    .in(
      'player_id',
      players.map((p) => p.id),
    )
  if (statsError) throw statsError

  const statsByPlayer = new Map(stats?.map((s) => [s.player_id, s]))
  return players.map((p) => ({
    ...p,
    stats: statsByPlayer.get(p.id) ?? { goals: 0, assists: 0, yellow_cards: 0, red_cards: 0 },
  }))
}

export async function createPlayer(supabase: Supabase, input: PlayerInsert) {
  const { data, error } = await supabase.from('players').insert(input).select().single()
  if (error) throw error
  return data
}

export async function updatePlayer(supabase: Supabase, id: string, input: PlayerUpdate) {
  const { data, error } = await supabase
    .from('players')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deletePlayer(supabase: Supabase, id: string) {
  const { error } = await supabase.from('players').delete().eq('id', id)
  if (error) throw error
}
