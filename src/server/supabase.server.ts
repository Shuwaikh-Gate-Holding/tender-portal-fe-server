import { createServerClient } from '@supabase/ssr'
import { getCookie, setCookie } from '@tanstack/react-start/server'

export function getSupabaseServerClient() {
  return createServerClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: getCookie,
        set: setCookie,
        remove(name, options) {
          setCookie(name, '', { ...options, maxAge: 0 })
        },
      },
    }
  )
}
