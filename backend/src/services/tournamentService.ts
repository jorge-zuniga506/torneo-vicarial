import { supabaseAdmin } from '../lib/supabaseAdmin'
import { HttpError } from '../utils/httpError'

// Estas dos operaciones sí usan la service role (supabaseAdmin): son
// cross-cutting y no hay una fila/policy natural que las module — por eso
// requireAdmin las protege en el middleware, no RLS.

export async function startTournament(tournamentId: string) {
  const { data, error } = await supabaseAdmin
    .from('tournaments')
    .update({ status: 'IN_PROGRESS', starts_at: new Date().toISOString() })
    .eq('id', tournamentId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function endTournament(tournamentId: string) {
  const { data: final, error: finalError } = await supabaseAdmin
    .from('matches')
    .select('status, winner_team_id, home_team_id, away_team_id')
    .eq('tournament_id', tournamentId)
    .eq('stage', 'FINAL')
    .maybeSingle()

  if (finalError) throw finalError
  if (!final || final.status !== 'FINALIZADO' || !final.winner_team_id) {
    throw new HttpError(409, 'La final todavía no terminó — no se puede cerrar el torneo.')
  }

  const runnerUpTeamId =
    final.winner_team_id === final.home_team_id ? final.away_team_id : final.home_team_id

  const { data, error } = await supabaseAdmin
    .from('tournaments')
    .update({
      status: 'FINISHED',
      ends_at: new Date().toISOString(),
      champion_team_id: final.winner_team_id,
      runner_up_team_id: runnerUpTeamId,
    })
    .eq('id', tournamentId)
    .select()
    .single()
  if (error) throw error
  return data
}
