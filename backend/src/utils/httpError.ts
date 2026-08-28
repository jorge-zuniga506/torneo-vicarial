export class HttpError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

/** Mapea un error de Postgres/PostgREST (via supabase-js) a un status HTTP razonable. */
export function statusFromSupabaseError(error: { code?: string } | null): number {
  if (!error?.code) return 500
  if (error.code === '42501') return 403 // insufficient_privilege (RLS o RAISE con ese errcode)
  if (error.code === 'PGRST116') return 404 // .single() sin filas
  if (error.code.startsWith('23')) return 409 // violación de constraint (unique, fk, check)
  return 500
}
