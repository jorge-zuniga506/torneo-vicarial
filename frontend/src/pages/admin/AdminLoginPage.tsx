import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { toast } from '../../lib/toast'
import logo from '../../assets/logo.png'

export function AdminLoginPage() {
  const { session, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && session) {
    return <Navigate to="/admin" replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email o contraseña incorrectos.')
      toast.err('Email o contraseña incorrectos.')
    } else {
      toast.ok('Sesión iniciada', email)
    }
    setSubmitting(false)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-crema px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-linea bg-panel p-8"
      >
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <img src={logo} alt="" className="h-12 w-12 object-contain" />
          <h1 className="text-lg font-bold text-tinta">Panel de administración</h1>
        </div>

        <div className="mb-4 flex flex-col gap-1.5">
          <label htmlFor="email" className="text-xs font-medium text-tinta-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-linea bg-crema px-3 py-2 text-sm text-tinta outline-none focus:border-azul-600"
          />
        </div>

        <div className="mb-5 flex flex-col gap-1.5">
          <label htmlFor="password" className="text-xs font-medium text-tinta-2">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-linea bg-crema px-3 py-2 text-sm text-tinta outline-none focus:border-azul-600"
          />
        </div>

        {error && <p className="mb-4 text-sm text-vino-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-azul-600 py-2.5 text-sm font-semibold text-white transition hover:bg-azul-500 disabled:opacity-60"
        >
          {submitting ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>

      <Link
        to="/"
        className="flex items-center gap-1.5 text-sm text-tinta-2 hover:text-tinta"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al sitio
      </Link>
    </div>
  )
}
