import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import * as standingsController from '../controllers/standingsController'

export const standingsRouter = Router()

standingsRouter.get('/standings', asyncHandler(standingsController.getStandings))
