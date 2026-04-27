import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from './supabase.server'

export interface Rfp {
  id: string
  title: string
  description: string
  status: string
  starts_at: string
  ends_at: string
  category_id: number
}

export const fetchOpenRfps = createServerFn({
  method: 'GET',
}).handler(async () => {
  const supabase = getSupabaseServerClient()

  // 1. Get current user's email
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) return []

  // 2. Get vendor's assigned category IDs
  const { data: vendorCategories } = await supabase
    .from('vendor_categories')
    .select('category_id')
    .eq('vendor_email', session.user.email)

  const categoryIds = vendorCategories?.map((vc) => vc.category_id) || []

  // 3. Fetch RFPs that match vendor's categories
  let query = supabase
    .from('rfps')
    .select('id,title,description,status,starts_at,ends_at,category_id')
    .eq('status', 'open')
    .order('starts_at', { ascending: false })

  // Filter by categories if vendor has any assigned
  if (categoryIds.length > 0) {
    query = query.in('category_id', categoryIds)
  } else {
    // If vendor has no categories, show no RFPs
    query = query.eq('category_id', -1) // Non-existent category
  }

  const { data, error } = await query

  if (error) {
    console.error('[SERVER] Error loading RFPs:', error)
    return []
  }

  return data
})






