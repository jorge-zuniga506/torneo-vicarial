import type { Response } from 'express'
import { supabaseForRequest } from '../lib/supabaseForRequest'
import type { AuthedRequest } from '../middleware/requireAuth'
import * as playersService from '../services/playersService'
import { requireParam } from '../utils/params'

export async function getPlayers(req: AuthedRequest, res: Response) {
  const supabase = supabaseForRequest(req)
  const teamId = typeof req.query.teamId === 'string' ? req.query.teamId : undefined
  res.json(await playersService.listPlayers(supabase, teamId))
}

export async function postPlayer(req: AuthedRequest, res: Response) {
  const supabase = supabaseForRequest(req)
  res.status(201).json(await playersService.createPlayer(supabase, req.body))
}

export async function putPlayer(req: AuthedRequest, res: Response) {
  const supabase = supabaseForRequest(req)
  res.json(await playersService.updatePlayer(supabase, requireParam(req.params.id, 'id'), req.body))
}

export async function deletePlayerHandler(req: AuthedRequest, res: Response) {
  const supabase = supabaseForRequest(req)
  await playersService.deletePlayer(supabase, requireParam(req.params.id, 'id'))
  res.status(204).end()
}
