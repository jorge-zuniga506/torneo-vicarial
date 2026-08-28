import { supabase } from '../lib/supabase'
import type { Tournament, TournamentSettings } from '../types/tournament'
import type { Database } from '../types/database'

type SettingsUpdate = Database['public']['Tables']['tournament_settings']['Update']

/**
 * Este template asume un torneo activo a la vez (el más reciente creado).
 * Si más adelante hace falta manejar varios torneos en paralelo, este es
 * el único lugar que hay que tocar.
 */
export async function fetchActiveTournament(): Promise<{
  tournament: Tournament
  settings: TournamentSettings
} | null> {
  const { data: tournament, error } = await supabase
    .from('tournaments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  if (!tournament) return null

  const { data: settings, error: settingsError } = await supabase
    .from('tournament_settings')
    .select('*')
    .eq('tournament_id', tournament.id)
    .single()
  if (settingsError) throw settingsError

  return { tournament, settings }
}

type TournamentStatus = Tournament['status']

/** Cambia el estado del torneo (RLS: `tournaments_admin_update`). */
export async function updateTournamentStatus(
  id: string,
  status: TournamentStatus,
  extra: { starts_at?: string; ends_at?: string } = {},
): Promise<Tournament> {
  const { data, error } = await supabase
    .from('tournaments')
    .update({ status, ...extra })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

/** Actualiza la config del torneo (RLS: `tournament_settings_admin_update`). */
export async function updateTournamentSettings(
  tournamentId: string,
  patch: SettingsUpdate,
): Promise<TournamentSettings> {
  const { data, error } = await supabase
    .from('tournament_settings')
    .update(patch)
    .eq('tournament_id', tournamentId)
    .select()
    .single()
  if (error) throw error
  return data
}
