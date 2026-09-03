import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'

type DrawInsert = Database['public']['Tables']['roulette_draws']['Insert']

/** Registra un giro de la ruleta (RLS: `roulette_draws_admin_all`). */
export async function saveRouletteDraw(input: DrawInsert) {
  const { data, error } = await supabase.from('roulette_draws').insert(input).select().single()
  if (error) throw error
  return data
}

/**
 * Sortea los cuartos de final: llena QF1..QF4 con los 8 clasificados (3
 * primeros + 3 segundos + 2 mejores terceros), evitando cruces del mismo
 * grupo, y deja el peor tercero eliminado. Todo en Postgres
 * (`draw_quarterfinals`, chequea `is_admin()` y exige los 9 partidos de
 * grupos finalizados). El admin puede editar cada llave luego en /admin/matches.
 */
export async function drawQuarterfinals(tournamentId: string): Promise<void> {
  const { error } = await supabase.rpc('draw_quarterfinals', { p_tournament_id: tournamentId })
  if (error) throw error
}
