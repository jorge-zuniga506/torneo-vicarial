import { supabase } from '../lib/supabase'
import type { MatchWithTeams } from '../types/tournament'
import type { Database } from '../types/database'

type MatchInsert = Database['public']['Tables']['matches']['Insert']
type MatchUpdate = Database['public']['Tables']['matches']['Update']

// FKs explícitas: teams tiene dos relaciones distintas con matches
// (home_team_id y away_team_id), PostgREST necesita el nombre exacto para
// no ambigüar el embed.
const MATCH_SELECT =
  '*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)'

export async function fetchMatches(tournamentId: string): Promise<MatchWithTeams[]> {
  const { data, error } = await supabase
    .from('matches')
    .select(MATCH_SELECT)
    .eq('tournament_id', tournamentId)
    .order('scheduled_at')
  if (error) throw error
  return data as unknown as MatchWithTeams[]
}

export async function fetchMatchById(id: string): Promise<MatchWithTeams> {
  const { data, error } = await supabase.from('matches').select(MATCH_SELECT).eq('id', id).single()
  if (error) throw error
  return data as unknown as MatchWithTeams
}

/** RLS: `matches_admin_insert` / `matches_admin_update` / `matches_admin_delete`. */
export async function createMatch(input: MatchInsert) {
  const { data, error } = await supabase.from('matches').insert(input).select().single()
  if (error) throw error
  return data
}

export async function updateMatch(id: string, input: MatchUpdate) {
  const { data, error } = await supabase.from('matches').update(input).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteMatch(id: string): Promise<void> {
  const { error } = await supabase.from('matches').delete().eq('id', id)
  if (error) throw error
}

/** Reescribe `scheduled_at` de varios partidos (reprogramado del calendario). */
export async function updateMatchTimes(
  changes: { id: string; scheduled_at: string }[],
): Promise<void> {
  const results = await Promise.all(
    changes.map((c) =>
      supabase.from('matches').update({ scheduled_at: c.scheduled_at }).eq('id', c.id),
    ),
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) throw failed.error
}
