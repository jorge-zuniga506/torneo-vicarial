import { supabase } from '../lib/supabase'
import type { Team } from '../types/tournament'
import type { Database } from '../types/database'

type TeamInsert = Database['public']['Tables']['teams']['Insert']
type TeamUpdate = Database['public']['Tables']['teams']['Update']

export async function fetchTeams(tournamentId: string): Promise<Team[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('short_name')
  if (error) throw error
  return data
}

/** Alta de equipo. Requiere sesión admin (RLS: `teams_admin_insert`). */
export async function createTeam(input: TeamInsert): Promise<Team> {
  const { data, error } = await supabase.from('teams').insert(input).select().single()
  if (error) throw error
  return data
}

export async function updateTeam(id: string, input: TeamUpdate): Promise<Team> {
  const { data, error } = await supabase.from('teams').update(input).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteTeam(id: string): Promise<void> {
  const { error } = await supabase.from('teams').delete().eq('id', id)
  if (error) throw error
}

/**
 * Desempate manual del admin (columna `teams.manual_tiebreak`): mayor valor =
 * mejor posición entre equipos igualados tras PTS/DG/GF/H2H. Después hay que
 * llamar `recalculateStandings` para que se refleje en la tabla.
 */
export async function setManualTiebreak(id: string, value: number): Promise<Team> {
  return updateTeam(id, { manual_tiebreak: value })
}

/** Reconstruye `standings` desde los partidos finalizados (RPC en Postgres). */
export async function recalculateStandings(tournamentId: string): Promise<void> {
  const { error } = await supabase.rpc('recalculate_standings', { p_tournament_id: tournamentId })
  if (error) throw error
}
