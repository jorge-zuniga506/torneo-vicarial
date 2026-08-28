import type { Response } from 'express'
import { supabaseForRequest } from '../lib/supabaseForRequest'
import type { AuthedRequest } from '../middleware/requireAuth'
import * as standingsService from '../services/standingsService'
import { HttpError } from '../utils/httpError'

export async function getStandings(req: AuthedRequest, res: Response) {
  const tournamentId = typeof req.query.tournamentId === 'string' ? req.query.tournamentId : undefined
  if (!tournamentId) throw new HttpError(400, 'Falta el query param tournamentId')

  const supabase = supabaseForRequest(req)
  res.json(await standingsService.listStandings(supabase, tournamentId))
}
