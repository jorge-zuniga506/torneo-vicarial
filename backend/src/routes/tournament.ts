import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth'
import { requireAdmin } from '../middleware/requireAdmin'
import { asyncHandler } from '../utils/asyncHandler'
import * as tournamentController from '../controllers/tournamentController'

export const tournamentRouter = Router()

tournamentRouter.post(
  '/tournament/start',
  requireAuth,
  requireAdmin,
  asyncHandler(tournamentController.postStart),
)
tournamentRouter.post(
  '/tournament/end',
  requireAuth,
  requireAdmin,
  asyncHandler(tournamentController.postEnd),
)
