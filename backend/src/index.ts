import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import type { NextFunction, Request, Response } from 'express'
import { matchesRouter } from './routes/matches'
import { playersRouter } from './routes/players'
import { standingsRouter } from './routes/standings'
import { teamsRouter } from './routes/teams'
import { tournamentRouter } from './routes/tournament'
import { statusFromSupabaseError } from './utils/httpError'

const app = express()
const port = process.env.PORT ? Number(process.env.PORT) : 3001
const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173'

app.use(cors({ origin: frontendUrl }))
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api', teamsRouter)
app.use('/api', playersRouter)
app.use('/api', matchesRouter)
app.use('/api', standingsRouter)
app.use('/api', tournamentRouter)

// Error handler central: mapea errores de Supabase/Postgres (via
// supabase-js) y HttpError propios a un status HTTP razonable. Todas las
// rutas usan asyncHandler(), así que cualquier throw/rejection llega acá.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err)
  const error = err as { status?: number; code?: string; message?: string }
  const status = error?.status ?? statusFromSupabaseError(error ?? null)
  res.status(status).json({ error: error?.message ?? 'Error interno' })
})

app.listen(port, () => {
  console.log(`Backend escuchando en http://localhost:${port}`)
})
