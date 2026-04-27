import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!,
)
