import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth'
import { asyncHandler } from '../utils/asyncHandler'
import * as matchesController from '../controllers/matchesController'

export const matchesRouter = Router()

matchesRouter.get('/matches', asyncHandler(matchesController.getMatches))
matchesRouter.get('/matches/:id', asyncHandler(matchesController.getMatchById))
matchesRouter.post('/matches', requireAuth, asyncHandler(matchesController.postMatch))
matchesRouter.put('/matches/:id', requireAuth, asyncHandler(matchesController.putMatch))
matchesRouter.post('/matches/:id/events', requireAuth, asyncHandler(matchesController.postMatchEvent))
matchesRouter.put('/matches/:id/score', requireAuth, asyncHandler(matchesController.putMatchScore))
matchesRouter.patch('/matches/:id/clock', requireAuth, asyncHandler(matchesController.patchMatchClock))
