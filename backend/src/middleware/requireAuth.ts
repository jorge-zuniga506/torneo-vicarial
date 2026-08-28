import type { NextFunction, Request, Response } from 'express'
import { supabaseAdmin } from '../lib/supabaseAdmin'

export interface AuthedRequest extends Request {
  userId?: string
}

/**
 * Verifica el JWT de sesión que manda el frontend (el mismo access_token que
 * Supabase Auth le dio al usuario logueado) contra Supabase. Si es válido,
 * expone req.userId; si no, corta con 401. Usalo en cualquier ruta que
 * necesite saber "quién es" antes de tocar la service role key.
 */
export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    res.status(401).json({ error: 'Falta el header Authorization: Bearer <token>' })
    return
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data.user) {
    res.status(401).json({ error: 'Token inválido o expirado' })
    return
  }

  req.userId = data.user.id
  next()
}
