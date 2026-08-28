import { HttpError } from './httpError'

/** Valida (no solo castea) que un param de ruta sea un string simple. */
export function requireParam(value: string | string[] | undefined, name: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new HttpError(400, `Parámetro de ruta inválido: ${name}`)
  }
  return value
}
