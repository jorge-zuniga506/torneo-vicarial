import type { Response } from 'express'
import { supabaseForRequest } from '../lib/supabaseForRequest'
import type { AuthedRequest } from '../middleware/requireAuth'
import * as teamsService from '../services/teamsService'
import { requireParam } from '../utils/params'

export async function getTeams(req: AuthedRequest, res: Response) {
  const supabase = supabaseForRequest(req)
  const tournamentId = typeof req.query.tournamentId === 'string' ? req.query.tournamentId : undefined
  res.json(await teamsService.listTeams(supabase, tournamentId))
}

export async function getTeamById(req: AuthedRequest, res: Response) {
  const supabase = supabaseForRequest(req)
  res.json(await teamsService.getTeam(supabase, requireParam(req.params.id, 'id')))
}

export async function postTeam(req: AuthedRequest, res: Response) {
  const supabase = supabaseForRequest(req)
  res.status(201).json(await teamsService.createTeam(supabase, req.body))
}

export async function putTeam(req: AuthedRequest, res: Response) {
  const supabase = supabaseForRequest(req)
  res.json(await teamsService.updateTeam(supabase, requireParam(req.params.id, 'id'), req.body))
}

export async function deleteTeamHandler(req: AuthedRequest, res: Response) {
  const supabase = supabaseForRequest(req)
  await teamsService.deleteTeam(supabase, requireParam(req.params.id, 'id'))
  res.status(204).end()
}
