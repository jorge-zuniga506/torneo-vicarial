import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    'Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY. Copiá backend/.env.example a backend/.env y completá los valores (Supabase, Project Settings, API, service_role).',
  )
}

/**
 * Cliente de Supabase con la service role key: tiene permisos totales y
 * evita Row Level Security. SOLO debe usarse acá, del lado del servidor.
 * Nunca importar este archivo desde el frontend ni exponer esta key al navegador.
 */
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})
