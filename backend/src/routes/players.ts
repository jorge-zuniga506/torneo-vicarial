import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth'
import { asyncHandler } from '../utils/asyncHandler'
import * as playersController from '../controllers/playersController'

export const playersRouter = Router()

playersRouter.get('/players', asyncHandler(playersController.getPlayers))
playersRouter.post('/players', requireAuth, asyncHandler(playersController.postPlayer))
playersRouter.put('/players/:id', requireAuth, asyncHandler(playersController.putPlayer))
playersRouter.delete('/players/:id', requireAuth, asyncHandler(playersController.deletePlayerHandler))
