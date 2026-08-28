import type { Response } from 'express'
import type { AuthedRequest } from '../middleware/requireAuth'
import * as tournamentService from '../services/tournamentService'
import { HttpError } from '../utils/httpError'

export async function postStart(req: AuthedRequest, res: Response) {
  const { tournament_id } = req.body ?? {}
  if (!tournament_id) throw new HttpError(400, 'Falta tournament_id')
  res.json(await tournamentService.startTournament(tournament_id))
}

export async function postEnd(req: AuthedRequest, res: Response) {
  const { tournament_id } = req.body ?? {}
  if (!tournament_id) throw new HttpError(400, 'Falta tournament_id')
  res.json(await tournamentService.endTournament(tournament_id))
}
