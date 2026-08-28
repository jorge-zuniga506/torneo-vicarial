import { toast as sonner } from 'sonner'

/**
 * Envoltorio corto sobre sonner para usar en toda la app.
 * - `ok` / `info` / `warn`: confirmaciones de acciones.
 * - `err`: errores.
 * Los eventos "en vivo" del torneo (gol, inicio, final…) los maneja aparte
 * `useTournamentToasts`.
 */
function messageOf(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return fallback
}

export const toast = {
  ok(title: string, description?: string) {
    sonner.success(title, { description })
  },
  info(title: string, description?: string) {
    sonner.info(title, { description })
  },
  warn(title: string, description?: string) {
    sonner.warning(title, { description })
  },
  err(error: unknown, fallback = 'Algo salió mal') {
    sonner.error('Error', { description: messageOf(error, fallback), duration: 5000 })
  },
}
