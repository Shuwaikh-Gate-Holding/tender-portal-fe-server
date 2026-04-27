import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from './supabase.server'

export interface RfpStats {
  id: string
  title: string
  status: string
  starts_at: string
  ends_at: string
  vendor_count?: number
  bid_count?: number
}

export interface AdminDashboardData {
  rfps: RfpStats[]
  stats: {
    total_rfps: number
    active_rfps: number
    total_vendors: number
  }
}

export const fetchAdminDashboardData = createServerFn({
  method: 'GET',
}).handler(async () => {
  const supabase = getSupabaseServerClient()

  const { data: rfpData, error: rfpError } = await supabase
    .from('rfps')
    .select('id,title,status,starts_at,ends_at')
    .order('created_at', { ascending: false })

  const { count: vendorCount, error: vendorError } = await supabase
    .from('vendors')
    .select('*', { count: 'exact', head: true })

  if (rfpError || vendorError) {
    console.error('[ADMIN SERVER] Error fetching dashboard data:', {
      rfpError,
      vendorError,
    })
    return {
      rfps: [],
      stats: { total_rfps: 0, active_rfps: 0, total_vendors: 0 },
    }
  }

  const rfps = rfpData as RfpStats[]

  return {
    rfps,
    stats: {
      total_rfps: rfps.length,
      active_rfps: rfps.filter((r) => r.status === 'open').length,
      total_vendors: vendorCount || 0,
    },
  }
})

export const updateRfpStatus = createServerFn({
  method: 'POST',
})
  .inputValidator((d: { rfpId: string; status: string }) => d)
  .handler(async ({ data: { rfpId, status } }) => {
    const supabase = getSupabaseServerClient()

    const { error } = await supabase
      .from('rfps')
      .update({ status })
      .eq('id', rfpId)

    if (error) {
      throw new Error(`Failed to update RFP status: ${error.message}`)
    }

    return { success: true }
  })

export const publishRfpAction = createServerFn({
  method: 'POST',
})
  .inputValidator((d: { rfpId: string }) => d)
  .handler(async ({ data: { rfpId } }) => {
    const supabase = getSupabaseServerClient()

    // 1. Get RFP's category
    const { data: rfpData, error: rfpFetchError } = await supabase
      .from('rfps')
      .select('category_id')
      .eq('id', rfpId)
      .single()

    if (rfpFetchError) throw new Error('Failed to fetch RFP category')

    // 2. Update RFP status to open
    const { error: updateError } = await supabase
      .from('rfps')
      .update({ status: 'open' })
      .eq('id', rfpId)

    if (updateError) throw new Error('Failed to publish RFP')

    // 3. Auto-create invitations for vendors in the same category
    if (rfpData.category_id) {
      const { data: vendors } = await supabase
        .from('vendor_categories')
        .select('vendor_email')
        .eq('category_id', rfpData.category_id)

      if (vendors && vendors.length > 0) {
        // Get existing invitations to avoid duplicates
        const { data: existingInvitations } = await supabase
          .from('rfp_invitations')
          .select('vendor_email')
          .eq('rfp_id', rfpId)

        const existingEmails = new Set(
          existingInvitations?.map((inv) => inv.vendor_email) || [],
        )

        // Only create invitations for vendors who don't already have one
        const newInvitations = vendors
          .filter((v) => !existingEmails.has(v.vendor_email))
          .map((v) => ({
            rfp_id: rfpId,
            vendor_email: v.vendor_email,
          }))

        if (newInvitations.length > 0) {
          await supabase.from('rfp_invitations').insert(newInvitations)
        }
      }
    }

    return { success: true }
  })






