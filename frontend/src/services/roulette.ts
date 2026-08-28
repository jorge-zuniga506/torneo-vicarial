import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'

type DrawInsert = Database['public']['Tables']['roulette_draws']['Insert']

/** Registra un giro de la ruleta (RLS: `roulette_draws_admin_all`). */
export async function saveRouletteDraw(input: DrawInsert) {
  const { data, error } = await supabase.from('roulette_draws').insert(input).select().single()
  if (error) throw error
  return data
}
