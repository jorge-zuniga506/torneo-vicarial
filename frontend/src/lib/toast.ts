import { sileo } from 'sileo'

/**
 * Envoltorio corto sobre sileo para usar en toda la app.
 * - `ok` / `info`: confirmaciones de acciones, abajo a la derecha, cortas.
 * - `err`: errores, arriba al centro, más visibles.
 * Los eventos "en vivo" del torneo (gol, inicio, final…) los maneja aparte
 * `useTournamentToasts`, arriba al centro.
 */
function messageOf(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return fallback
}

export const toast = {
  ok(title: string, description?: string) {
    sileo.success({ title, description, position: 'bottom-right', duration: 2600 })
  },
  info(title: string, description?: string) {
    sileo.info({ title, description, position: 'bottom-right', duration: 2600 })
  },
  warn(title: string, description?: string) {
    sileo.warning({ title, description, position: 'bottom-right', duration: 3200 })
  },
  err(error: unknown, fallback = 'Algo salió mal') {
    sileo.error({
      title: 'Error',
      description: messageOf(error, fallback),
      position: 'top-center',
      duration: 5000,
    })
  },
}
