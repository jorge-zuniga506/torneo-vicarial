import { supabase } from '../lib/supabase'
import type { Player } from '../types/tournament'
import type { Database } from '../types/database'

type PlayerInsert = Database['public']['Tables']['players']['Insert']
type PlayerUpdate = Database['public']['Tables']['players']['Update']

export interface PlayerTeamRef {
  id: string
  name: string
  short_name: string
  color: string | null
  logo_url: string | null
}

export async function fetchPlayersByTeam(teamId: string): Promise<Player[]> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('team_id', teamId)
    .order('jersey_number', { nullsFirst: false })
  if (error) throw error
  return data
}

export async function fetchPlayersByTournament(
  tournamentId: string,
): Promise<(Player & { team: PlayerTeamRef | null })[]> {
  const { data, error } = await supabase
    .from('players')
    .select(
      '*, team:teams!players_team_id_fkey!inner(id, name, short_name, color, logo_url, tournament_id)',
    )
    .eq('team.tournament_id', tournamentId)
  if (error) throw error

  return (data ?? []).map((row) => {
    const raw = row.team as unknown
    const team = (Array.isArray(raw) ? raw[0] : raw) as PlayerTeamRef | null
    return { ...(row as unknown as Player), team }
  })
}

/** RLS: `players_admin_insert` / `players_admin_update` / `players_admin_delete`. */
export async function createPlayer(input: PlayerInsert): Promise<Player> {
  const { data, error } = await supabase.from('players').insert(input).select().single()
  if (error) throw error
  return data
}

export async function updatePlayer(id: string, input: PlayerUpdate): Promise<Player> {
  const { data, error } = await supabase.from('players').update(input).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deletePlayer(id: string): Promise<void> {
  const { error } = await supabase.from('players').delete().eq('id', id)
  if (error) throw error
}
