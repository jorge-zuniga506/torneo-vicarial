import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth'
import { asyncHandler } from '../utils/asyncHandler'
import * as teamsController from '../controllers/teamsController'

export const teamsRouter = Router()

teamsRouter.get('/teams', asyncHandler(teamsController.getTeams))
teamsRouter.get('/teams/:id', asyncHandler(teamsController.getTeamById))
teamsRouter.post('/teams', requireAuth, asyncHandler(teamsController.postTeam))
teamsRouter.put('/teams/:id', requireAuth, asyncHandler(teamsController.putTeam))
teamsRouter.delete('/teams/:id', requireAuth, asyncHandler(teamsController.deleteTeamHandler))
