import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from '#/server/supabase.server'

export interface Rfp {
  id: string
  title: string
  description: string
  status: string
  starts_at: string
  ends_at: string
  minimum_decrement: number
  base_amount: number
  attachment_url?: string
  bid_direction?: string
}

export interface RfpTerms {
  id: string
  terms_text: string
}

export interface Bid {
  id: string
  amount: number
  created_at: string
  is_mine: boolean
}

export const fetchRfpDetail = createServerFn({
  method: 'GET',
})
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data: { id } }) => {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('rfps')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error loading RFP', error)
      return null
    }

    return data as Rfp
  })

export const fetchRfpTerms = createServerFn({
  method: 'GET',
})
  .inputValidator((d: { rfpId: string }) => d)
  .handler(async ({ data: { rfpId } }) => {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('rfp_terms')
      .select('id, terms_text')
      .eq('rfp_id', rfpId)
      .order('id')

    if (error) {
      console.error('Error loading terms', error)
      return []
    }

    return (data) || []
  })

export const checkTermsAcceptance = createServerFn({
  method: 'GET',
})
  .inputValidator((d: { rfpId: string }) => d)
  .handler(async ({ data: { rfpId } }) => {
    const supabase = getSupabaseServerClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user?.email) return false

    const { data, error } = await supabase
      .from('rfp_invitations')
      .select('terms_accepted_at')
      .eq('rfp_id', rfpId)
      .eq('vendor_email', session.user.email)
      .maybeSingle()

    if (!error && data?.terms_accepted_at) {
      return true
    }

    return false
  })

export const checkVendorApproval = createServerFn({
  method: 'GET',
}).handler(async () => {
  const supabase = getSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user?.email) return false

  const { data } = await supabase
    .from('vendors')
    .select('approved')
    .eq('email', session.user.email.toLowerCase())
    .maybeSingle()

  return Boolean(data?.approved)
})

export const fetchAuctionTicker = createServerFn({
  method: 'GET',
})
  .inputValidator((d: { rfpId: string }) => d)
  .handler(async ({ data: { rfpId } }) => {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('auction_ticker')
      .select('current_best_bid,bid_count,last_updated')
      .eq('rfp_id', rfpId)
      .maybeSingle()

    if (error || !data) return null

    return {
      best_bid: data.current_best_bid,
      seq: data.bid_count,
      last_bid_at: data.last_updated,
    }
  })

export const fetchBids = createServerFn({
  method: 'GET',
})
  .inputValidator((d: { rfpId: string }) => d)
  .handler(async ({ data: { rfpId } }) => {
    const supabase = getSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const { data, error } = await supabase
      .from('bids')
      .select('id, bid_total, created_at, vendor_email')
      .eq('rfp_id', rfpId)
      .order('bid_total', { ascending: true })

    if (error || !data) return []

    const userEmail = session?.user?.email

    return data.map((bid: any) => ({
      id: bid.id,
      amount: bid.bid_total,
      created_at: bid.created_at,
      is_mine: bid.vendor_email === userEmail,
    }))
  })

export const fetchMyRank = createServerFn({
  method: 'GET',
})
  .inputValidator((d: { rfpId: string }) => d)
  .handler(async ({ data: { rfpId } }) => {
    const supabase = getSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user?.email) return null

    const { data, error } = await supabase.rpc('get_my_rank', {
      p_rfp_id: rfpId,
      p_vendor_email: session.user.email,
    })

    if (error || !data || (data as any[]).length === 0) return null

    return (data as any[])[0].rank as number
  })

export const placeBidAction = createServerFn({
  method: 'POST',
})
  .inputValidator(
    (d: {
      rfpId: string
      amount: number
      comments?: string
      attachmentUrls?: string[]
    }) => d,
  )
  .handler(async ({ data: { rfpId, amount, comments, attachmentUrls } }) => {
    const supabase = getSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user?.email) throw new Error('Not authenticated')

    const { error } = await supabase.rpc('place_bid', {
      p_rfp_id: rfpId,
      p_bid_total: amount,
      p_vendor_email: session.user.email,
      p_comments: comments || null,
      p_attachment_url:
        attachmentUrls && attachmentUrls.length > 0
          ? attachmentUrls.join(',')
          : null,
    })

    if (error) throw new Error(error.message)

    return { success: true }
  })






