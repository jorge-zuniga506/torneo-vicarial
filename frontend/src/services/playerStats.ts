import { supabase } from '../lib/supabase'
import type { PlayerStats, Team } from '../types/tournament'

export interface PlayerStatsRow {
  player_id: string
  team_id: string
  goals: number
  assists: number
  yellow_cards: number
  red_cards: number
  player: { id: string; name: string; jersey_number: number | null } | null
  team: Pick<Team, 'id' | 'name' | 'short_name' | 'color' | 'logo_url'> | null
}

/**
 * Ranking de jugadores del torneo (goles, asistencias, tarjetas). Los
 * números salen de la vista `player_stats` (agrega `match_events` en
 * Postgres); acá solo se hace el join con players/teams en memoria para no
 * depender de que PostgREST infiera relaciones sobre una vista.
 */
export async function fetchPlayerStats(tournamentId: string): Promise<PlayerStatsRow[]> {
  const { data: players, error: playersError } = await supabase
    .from('players')
    .select(
      'id, name, jersey_number, team_id, team:teams!players_team_id_fkey!inner(id, name, short_name, color, logo_url, tournament_id)',
    )
    .eq('team.tournament_id', tournamentId)
  if (playersError) throw playersError

  const { data: statsRows, error: statsError } = await supabase
    .from('player_stats')
    .select('player_id, team_id, goals, assists, yellow_cards, red_cards')
  if (statsError) throw statsError

  const statsByPlayer = new Map<string, PlayerStats>()
  for (const s of statsRows ?? []) {
    if (s.player_id) statsByPlayer.set(s.player_id, s)
  }

  return (players ?? []).map((p) => {
    const s = statsByPlayer.get(p.id)
    const teamRaw = p.team as unknown
    const team = (Array.isArray(teamRaw) ? teamRaw[0] : teamRaw) as PlayerStatsRow['team']
    return {
      player_id: p.id,
      team_id: p.team_id,
      goals: s?.goals ?? 0,
      assists: s?.assists ?? 0,
      yellow_cards: s?.yellow_cards ?? 0,
      red_cards: s?.red_cards ?? 0,
      player: { id: p.id, name: p.name, jersey_number: p.jersey_number },
      team,
    }
  })
}
