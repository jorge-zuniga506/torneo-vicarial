import { createClient } from '@supabase/supabase-js'
import type { Request } from 'express'
import type { Database } from '../types/database'

const supabaseUrl = process.env.SUPABASE_URL
const anonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !anonKey) {
  throw new Error(
    'Faltan SUPABASE_URL o SUPABASE_ANON_KEY. Copiá backend/.env.example a backend/.env y completá los valores.',
  )
}

/**
 * Cliente de Supabase con la anon key, pero reenviando el JWT del usuario
 * que hizo la request HTTP. Así Row Level Security decide qué puede hacer
 * — exactamente la misma autorización que si el frontend llamara a
 * Supabase directo. El backend NO reimplementa "quién es admin"; esa
 * lógica vive una sola vez en private.is_admin() (Postgres).
 */
export function supabaseForRequest(req: Request) {
  const authHeader = req.headers.authorization
  return createClient<Database>(supabaseUrl!, anonKey!, {
    global: { headers: authHeader ? { Authorization: authHeader } : {} },
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
