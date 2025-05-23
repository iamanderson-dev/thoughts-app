'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error || !session?.user?.email) {
        router.replace('/authentication/login?error=SessionError')
        return
      }

      const { data: user, error: dbError } = await supabase
        .from('users')
        .select('email')
        .eq('email', session.user.email.toLowerCase().trim())
        .single()

      if (dbError || !user) {
        await supabase.auth.signOut()
        router.replace('/authentication/login?error=NoAccount')
      } else {
        router.replace('/dashboard')
      }
    }

    handleAuthCallback()
  }, [router])

  return null
}
