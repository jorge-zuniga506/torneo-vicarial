/**
 * Segundo pinger anti-pausa de Supabase, redundante con
 * .github/workflows/keep-alive.yml. Lo dispara Vercel Cron (ver "crons" en
 * vercel.json). Hace lo mismo: una escritura real vía RPC ping_keepalive.
 *
 * Para DESACTIVARLO: borrá el bloque "crons" de frontend/vercel.json (y,
 * si querés, este archivo) y volvé a desplegar.
 *
 * Usa las env vars que ya tenés en Vercel para el build (VITE_*), o sus
 * versiones sin prefijo si preferís separarlas.
 */
export default async function handler(req, res) {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

  if (!url || !key) {
    res.status(500).json({ ok: false, error: 'Faltan SUPABASE_URL / SUPABASE_ANON_KEY en Vercel' })
    return
  }

  // Opcional: si definís CRON_SECRET en Vercel, sólo Vercel Cron (que manda ese
  // header) puede ejecutarlo. Si no lo definís, el endpoint es público (igual
  // sólo suma 1 a un contador, no hay nada sensible).
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    res.status(401).json({ ok: false, error: 'no autorizado' })
    return
  }

  const base = url.replace(/\/+$/, '')
  const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }

  try {
    const r = await fetch(`${base}/rest/v1/rpc/ping_keepalive`, {
      method: 'POST',
      headers,
      body: '{}',
    })
    const body = await r.text()
    if (!r.ok) throw new Error(`ping_keepalive ${r.status}: ${body}`)

    // Lectura extra como segunda señal
    await fetch(`${base}/rest/v1/tournaments?select=id&limit=1`, { headers })

    res.status(200).json({ ok: true, last_ping: body.replace(/"/g, ''), at: new Date().toISOString() })
  } catch (e) {
    res.status(500).json({ ok: false, error: String((e && e.message) || e) })
  }
}
