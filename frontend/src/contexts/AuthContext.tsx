import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { AuthContext } from './authContextInstance'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    let activo = true

    async function loadRole(userId: string | undefined) {
      if (!userId) {
        setIsAdmin(false)
        return
      }
      // El rol vive en public.profiles (no en user_metadata/app_metadata):
      // ver private.is_admin() en la base, que es la autorización real.
      const { data } = await supabase.from('profiles').select('role').eq('id', userId).single()
      if (activo) setIsAdmin(data?.role === 'ADMIN')
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      loadRole(data.session?.user.id).finally(() => {
        if (activo) setLoading(false)
      })
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      loadRole(newSession?.user.id)
    })

    return () => {
      activo = false
      sub.subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ session, loading, isAdmin }}>{children}</AuthContext.Provider>
  )
}
