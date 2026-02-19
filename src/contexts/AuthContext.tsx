import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../services/supabase'

type AuthContextValue = {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<Session | null>
  signIn: (email: string, password: string) => Promise<Session | null>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  verifyOtp: (email: string, token: string, type: 'signup' | 'recovery' | 'email_change' | 'email' | 'invite') => Promise<Session | null>
  resendOtp: (email: string, type: 'signup' | 'email_change') => Promise<void>
  updateDisplayName: (displayName: string) => Promise<void>
  deleteAccount: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!isMounted) return
        setUser(session?.user ?? null)
        setLoading(false)
      })
      .catch((error) => {
        if (!isMounted) return
        // Ignore aborted requests (common during hot reloads)
        if ((error as { name?: string }).name === 'AbortError') return
        // eslint-disable-next-line no-console
        console.error('Error getting Supabase session', error)
        setLoading(false)
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return
      setUser(session?.user ?? null)

      // Handle password recovery redirect
      if (event === 'PASSWORD_RECOVERY') {
        window.location.href = '/reset-password'
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    return data.session
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } =
      await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data.session
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) throw error
  }

  const verifyOtp = async (email: string, token: string, type: 'signup' | 'recovery' | 'email_change' | 'email' | 'invite') => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type,
    })
    if (error) throw error
    return data.session
  }

  const resendOtp = async (email: string, type: 'signup' | 'email_change') => {
    const { error } = await supabase.auth.resend({
      email,
      type,
    })
    if (error) throw error
  }

  const updateDisplayName = async (displayName: string) => {
    const { data, error } = await supabase.auth.updateUser({
      data: { display_name: displayName.trim() || undefined },
    })
    if (error) throw error
    if (data?.user) setUser(data.user)
  }

  const deleteAccount = async () => {
    const { error } = await supabase.rpc('delete_user_account')
    if (error) throw error
    await signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUp,
        signIn,
        signOut,
        resetPassword,
        verifyOtp,
        resendOtp,
        updateDisplayName,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}

