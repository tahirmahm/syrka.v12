'use client'

import { supabase } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => setUser(session?.user ?? null)
    )
    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
        scopes: 'email profile'
      }
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  if (loading) return null

  if (!user) return (
    <button onClick={signInWithGoogle}
      className="btn-ghost flex items-center gap-2 text-xs"
      style={{ background: 'none', border: '1px solid rgba(71,71,71,0.4)', cursor: 'pointer' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>
        account_circle
      </span>
      Sign in with Google
    </button>
  )

  return (
    <div className="flex items-center gap-3">
      {user.user_metadata?.avatar_url && (
        <img src={user.user_metadata.avatar_url}
             className="w-7 h-7"
             style={{ borderRadius: 0 }}
             alt="" />
      )}
      <span className="text-xs font-body text-on-surface-variant hidden sm:inline">
        {user.user_metadata?.full_name || user.email}
      </span>
      <button onClick={signOut}
        className="text-xs font-label text-on-surface-variant hover:text-primary uppercase tracking-widest transition-colors"
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
        Sign out
      </button>
    </div>
  )
}
