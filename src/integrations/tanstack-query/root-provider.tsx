import { QueryClient } from '@tanstack/react-query'
import { supabase } from '../../utils/supabase'

export function getContext() {
  const queryClient = new QueryClient()

  return {
    queryClient,
    supabase,
  }
}
export default function TanstackQueryProvider() {}
