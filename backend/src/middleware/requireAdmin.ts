import type { NextFunction, Response } from 'express'
import { supabaseAdmin } from '../lib/supabaseAdmin'
import type { AuthedRequest } from './requireAuth'

/**
 * Usar SIEMPRE después de requireAuth (necesita req.userId). Es el único
 * lugar del backend que reimplementa el chequeo de admin en Node — hace
 * falta acá porque tournamentService usa supabaseAdmin (service role, que
 * bypassa RLS) para operaciones cross-cutting que ninguna policy cubre
 * (arrancar/terminar el torneo). Todo lo demás pasa por
 * supabaseForRequest() y deja que Postgres decida.
 */
export async function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.userId) {
    res.status(401).json({ error: 'No autenticado' })
    return
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', req.userId)
    .single()

  if (error || data?.role !== 'ADMIN') {
    res.status(403).json({ error: 'Requiere rol de administrador' })
    return
  }

  next()
}
