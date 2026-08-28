import { supabase } from './supabase'

const backendUrl = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001'

/**
 * Llama a un endpoint de backend/ (Express), adjuntando el token de sesión
 * del usuario logueado en Supabase. Usalo para cualquier operación que
 * necesite pasar por el servidor (ver backend/src/routes/example.ts) en vez
 * de tocar Supabase directo desde el navegador.
 */
export async function callBackend<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  const res = await fetch(`${backendUrl}${path}`, {
    ...init,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  })

  if (!res.ok) {
    throw new Error(`Backend error ${res.status}: ${await res.text()}`)
  }

  return res.json() as Promise<T>
}
