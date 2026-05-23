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
      global: {
        fetch: async (url, options) => {
          // 1. Perform the original network request
          const response = await fetch(url, options)

          // 2. Intercept and clone the response so we can modify its text body
          const clonedResponse = response.clone()
          const rawText = await clonedResponse.text()

          // 3. Perform a global text replacement for the target URLs
          const modifiedText = rawText.replaceAll(
            'http://192.168.11.65:54321',
            'https://tender.shuwaikhgate.com',
          )

          // 4. Return a brand new Response object to the Supabase Client SDK
          return new Response(modifiedText, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
          })
        },
      },
    },
  )
}
