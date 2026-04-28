import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from './supabase.server'

export const fetchUserSession = createServerFn({
  method: 'GET',
}).handler(async () => {
  // 1. Initialize Supabase SSR Client
  const supabase = getSupabaseServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    return { user: null, role: null }
  }

  const email = session.user.email!.toLowerCase()

  // 3. Check Admin Status
  const { data: adminData } = await supabase
    .from('admins')
    .select('email')
    .eq('email', email)
    .maybeSingle()

  if (adminData) {
    return { user: session.user, role: 'admin' }
  }

  // 4. Ensure Vendor Record
  const { data: vendorExisting } = await supabase
    .from('vendors')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (!vendorExisting) {
    await supabase.from('vendors').insert([{ email: email }])
  }

  return { user: session.user, role: 'vendor' }
})

export const logoutAction = createServerFn({
  method: 'POST',
}).handler(async () => {
  const supabase = getSupabaseServerClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
  return { success: true }
})
