#!/usr/bin/env node
/**
 * keep-alive.mjs — mantiene "despierto" el proyecto de Supabase.
 *
 * El plan free de Supabase pausa un proyecto tras ~7 días sin actividad.
 * Este script hace una escritura real en la base (RPC `ping_keepalive`, que
 * actualiza la tabla `public.keepalive`) más una lectura, así queda registrada
 * actividad genuina. Pensado para correr desde un cron cada 2-3 días
 * (ver .github/workflows/keep-alive.yml), pero también sirve suelto:
 *
 *   node scripts/keep-alive.mjs
 *
 * Config (en este orden de prioridad):
 *   1. Variables de entorno  SUPABASE_URL  y  SUPABASE_ANON_KEY
 *   2. Flags                 --url=...     y  --key=...
 *   3. Autolectura de        frontend/.env.local  (VITE_SUPABASE_URL / _ANON_KEY)
 *
 * No tiene dependencias: sólo Node 18+ (fetch global).
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))

function fromArgs(name) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : undefined
}

function fromEnvFile(key) {
  try {
    const txt = readFileSync(resolve(HERE, '../frontend/.env.local'), 'utf8')
    const line = txt.split('\n').find((l) => l.trim().startsWith(`${key}=`))
    return line ? line.slice(key.length + 1).trim().replace(/^["']|["']$/g, '') : undefined
  } catch {
    return undefined
  }
}

const url =
  process.env.SUPABASE_URL ||
  fromArgs('url') ||
  process.env.VITE_SUPABASE_URL ||
  fromEnvFile('VITE_SUPABASE_URL')

const key =
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  fromArgs('key') ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  fromEnvFile('VITE_SUPABASE_ANON_KEY')

if (!url || !key) {
  console.error(
    'Falta configuración. Definí SUPABASE_URL y SUPABASE_ANON_KEY (o pasá --url= y --key=, ' +
      'o dejá que lo lea de frontend/.env.local).',
  )
  process.exit(1)
}

const base = url.replace(/\/+$/, '')
const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }

async function withTimeout(promise, ms = 15000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    return await promise(ctrl.signal)
  } finally {
    clearTimeout(t)
  }
}

try {
  // 1) Escritura: RPC ping_keepalive -> UPDATE public.keepalive
  const rpc = await withTimeout((signal) =>
    fetch(`${base}/rest/v1/rpc/ping_keepalive`, { method: 'POST', headers, body: '{}', signal }),
  )
  const rpcBody = await rpc.text()
  if (!rpc.ok) throw new Error(`RPC ping_keepalive ${rpc.status}: ${rpcBody}`)

  // 2) Lectura: una tabla pública cualquiera (señal extra)
  const read = await withTimeout((signal) =>
    fetch(`${base}/rest/v1/tournaments?select=id&limit=1`, { headers, signal }),
  )
  if (!read.ok) throw new Error(`GET tournaments ${read.status}: ${await read.text()}`)

  console.log(`[keep-alive] OK  ${new Date().toISOString()}  last_ping=${rpcBody.replace(/"/g, '')}`)
  process.exit(0)
} catch (err) {
  console.error(`[keep-alive] FALLO  ${new Date().toISOString()}\n${err?.message || err}`)
  process.exit(1)
}
