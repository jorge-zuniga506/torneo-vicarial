import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

type Supabase = SupabaseClient<Database>
type MatchInsert = Database['public']['Tables']['matches']['Insert']
type MatchUpdate = Database['public']['Tables']['matches']['Update']

const MATCH_SELECT = '*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)'

export async function listMatches(supabase: Supabase, tournamentId?: string) {
  let query = supabase.from('matches').select(MATCH_SELECT).order('scheduled_at')
  if (tournamentId) query = query.eq('tournament_id', tournamentId)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getMatch(supabase: Supabase, id: string) {
  const { data, error } = await supabase.from('matches').select(MATCH_SELECT).eq('id', id).single()
  if (error) throw error
  return data
}

export async function createMatch(supabase: Supabase, input: MatchInsert) {
  const { data, error } = await supabase.from('matches').insert(input).select().single()
  if (error) throw error
  return data
}

export async function updateMatch(supabase: Supabase, id: string, input: MatchUpdate) {
  const { data, error } = await supabase
    .from('matches')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// --- Eventos y marcador: SIEMPRE vía las funciones RPC centralizadas
// (record_goal/record_card/set_match_score), nunca escribiendo matches o
// match_events a mano acá — así la lógica vive en un solo lugar (Postgres)
// y frontend/backend nunca pueden desincronizarse entre sí.

interface GoalInput {
  matchId: string
  teamId: string
  playerId: string
  assistPlayerId?: string | null
  minute?: number | null
}

export async function recordGoal(supabase: Supabase, input: GoalInput) {
  const { error } = await supabase.rpc('record_goal', {
    p_match_id: input.matchId,
    p_team_id: input.teamId,
    p_player_id: input.playerId,
    p_assist_player_id: input.assistPlayerId ?? undefined,
    p_minute: input.minute ?? undefined,
  })
  if (error) throw error
}

interface CardInput {
  matchId: string
  teamId: string
  playerId: string
  cardType: 'YELLOW_CARD' | 'RED_CARD'
  minute?: number | null
}

export async function recordCard(supabase: Supabase, input: CardInput) {
  const { error } = await supabase.rpc('record_card', {
    p_match_id: input.matchId,
    p_team_id: input.teamId,
    p_player_id: input.playerId,
    p_card_type: input.cardType,
    p_minute: input.minute ?? undefined,
  })
  if (error) throw error
}

export async function setScore(supabase: Supabase, matchId: string, homeScore: number, awayScore: number) {
  const { error } = await supabase.rpc('set_match_score', {
    p_match_id: matchId,
    p_home_score: homeScore,
    p_away_score: awayScore,
  })
  if (error) throw error
}

const CLOCK_ACTIONS = {
  start: 'start_match',
  pause: 'pause_match',
  resume: 'resume_match',
  halftime: 'start_halftime',
  second_half: 'start_second_half',
  finish: 'finish_match',
} as const

export type ClockAction = keyof typeof CLOCK_ACTIONS

export async function runClockAction(supabase: Supabase, matchId: string, action: ClockAction) {
  const fn = CLOCK_ACTIONS[action]
  if (!fn) throw new Error(`Acción de cronómetro inválida: ${action}`)
  const { error } = await supabase.rpc(fn, { p_match_id: matchId })
  if (error) throw error
}
