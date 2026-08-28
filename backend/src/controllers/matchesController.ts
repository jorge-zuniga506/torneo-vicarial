import type { Response } from 'express'
import { supabaseForRequest } from '../lib/supabaseForRequest'
import type { AuthedRequest } from '../middleware/requireAuth'
import * as matchesService from '../services/matchesService'
import { requireParam } from '../utils/params'

export async function getMatches(req: AuthedRequest, res: Response) {
  const supabase = supabaseForRequest(req)
  const tournamentId = typeof req.query.tournamentId === 'string' ? req.query.tournamentId : undefined
  res.json(await matchesService.listMatches(supabase, tournamentId))
}

export async function getMatchById(req: AuthedRequest, res: Response) {
  const supabase = supabaseForRequest(req)
  res.json(await matchesService.getMatch(supabase, requireParam(req.params.id, 'id')))
}

export async function postMatch(req: AuthedRequest, res: Response) {
  const supabase = supabaseForRequest(req)
  res.status(201).json(await matchesService.createMatch(supabase, req.body))
}

export async function putMatch(req: AuthedRequest, res: Response) {
  const supabase = supabaseForRequest(req)
  res.json(await matchesService.updateMatch(supabase, requireParam(req.params.id, 'id'), req.body))
}

/**
 * POST /api/matches/:id/events
 * body: { type: 'GOAL' | 'YELLOW_CARD' | 'RED_CARD', team_id, player_id, assist_player_id?, minute? }
 */
export async function postMatchEvent(req: AuthedRequest, res: Response) {
  const supabase = supabaseForRequest(req)
  const matchId = requireParam(req.params.id, 'id')
  const { type, team_id, player_id, assist_player_id, minute } = req.body ?? {}

  if (type === 'GOAL') {
    await matchesService.recordGoal(supabase, {
      matchId,
      teamId: team_id,
      playerId: player_id,
      assistPlayerId: assist_player_id,
      minute,
    })
  } else if (type === 'YELLOW_CARD' || type === 'RED_CARD') {
    await matchesService.recordCard(supabase, {
      matchId,
      teamId: team_id,
      playerId: player_id,
      cardType: type,
      minute,
    })
  } else {
    res.status(400).json({ error: `Tipo de evento no soportado: ${type}` })
    return
  }

  res.status(201).json({ ok: true })
}

/** PUT /api/matches/:id/score  body: { home_score, away_score } */
export async function putMatchScore(req: AuthedRequest, res: Response) {
  const supabase = supabaseForRequest(req)
  const { home_score, away_score } = req.body ?? {}
  await matchesService.setScore(supabase, requireParam(req.params.id, 'id'), home_score, away_score)
  res.json({ ok: true })
}

/** PATCH /api/matches/:id/clock  body: { action: 'start'|'pause'|'resume'|'halftime'|'second_half'|'finish' } */
export async function patchMatchClock(req: AuthedRequest, res: Response) {
  const supabase = supabaseForRequest(req)
  const { action } = req.body ?? {}
  await matchesService.runClockAction(supabase, requireParam(req.params.id, 'id'), action)
  res.json({ ok: true })
}
