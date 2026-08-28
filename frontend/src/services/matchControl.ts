import { supabase } from '../lib/supabase'

/**
 * Envoltorios sobre las funciones RPC de Postgres. Toda la lógica de
 * marcador / eventos / cronómetro vive en la base (chequean `is_admin()`
 * internamente y mantienen `match_events`, `standings` y el bracket
 * sincronizados). Acá solo las llamamos.
 */

export async function recordGoal(
  matchId: string,
  teamId: string,
  playerId: string | null,
  opts: { assistPlayerId?: string | null; minute?: number | null } = {},
): Promise<void> {
  const { error } = await supabase.rpc('record_goal', {
    p_match_id: matchId,
    p_team_id: teamId,
    p_player_id: playerId,
    p_assist_player_id: opts.assistPlayerId ?? undefined,
    p_minute: opts.minute ?? undefined,
  })
  if (error) throw error
}

export async function recordCard(
  matchId: string,
  teamId: string,
  playerId: string | null,
  cardType: 'YELLOW_CARD' | 'RED_CARD',
  minute?: number | null,
): Promise<void> {
  const { error } = await supabase.rpc('record_card', {
    p_match_id: matchId,
    p_team_id: teamId,
    p_player_id: playerId,
    p_card_type: cardType,
    p_minute: minute ?? undefined,
  })
  if (error) throw error
}

export async function undoGoal(matchId: string, teamId: string, eventId: string): Promise<void> {
  const { error } = await supabase.rpc('undo_goal', {
    p_match_id: matchId,
    p_team_id: teamId,
    p_event_id: eventId,
  })
  if (error) throw error
}

export async function setScore(matchId: string, home: number, away: number): Promise<void> {
  const { error } = await supabase.rpc('set_match_score', {
    p_match_id: matchId,
    p_home_score: home,
    p_away_score: away,
  })
  if (error) throw error
}

export type ClockAction = 'start' | 'pause' | 'resume' | 'halftime' | 'second_half' | 'finish'

const CLOCK_RPC: Record<ClockAction, string> = {
  start: 'start_match',
  pause: 'pause_match',
  resume: 'resume_match',
  halftime: 'start_halftime',
  second_half: 'start_second_half',
  finish: 'finish_match',
}

export async function runClock(matchId: string, action: ClockAction): Promise<void> {
  const { error } = await supabase.rpc(CLOCK_RPC[action], { p_match_id: matchId })
  if (error) throw error
}

/** Devuelve el partido a 0-0 / PROGRAMADO, borra sus eventos y recalcula la tabla. */
export async function resetMatch(matchId: string): Promise<void> {
  const { error } = await supabase.rpc('reset_match', { p_match_id: matchId })
  if (error) throw error
}
