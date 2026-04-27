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
  attachment_url?: string
}

export interface Bid {
  id: string
  amount: number
  vendor_email: string
  created_at: string
  comments?: string
  attachment_url?: string
}

export const fetchRfpDetail = createServerFn({
  method: 'GET',
})
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { data: rfpData, error } = await supabase
      .from('rfps')
      .select('*')
      .eq('id', data.id)
      .single()

    if (error) throw new Error(error.message)
    return rfpData as Rfp
  })

export const fetchBids = createServerFn({
  method: 'GET',
})
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { data: bidsData, error } = await supabase
      .from('bids')
      .select('id, bid_total, created_at, vendor_email, comments, attachment_url')
      .eq('rfp_id', data.id)
      .order('bid_total', { ascending: true })

    if (error) throw new Error(error.message)

    return (bidsData || []).map((bid) => ({
      id: bid.id,
      amount: bid.bid_total,
      vendor_email: bid.vendor_email,
      created_at: bid.created_at,
      comments: bid.comments,
      attachment_url: bid.attachment_url,
    })) as Bid[]
  })

export const updateRfpStatusAction = createServerFn({
  method: 'POST',
})
  .inputValidator((d: { id: string; status: string }) => d)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { error } = await supabase
      .from('rfps')
      .update({ status: data.status })
      .eq('id', data.id)

    if (error) throw new Error(error.message)
    return { success: true }
  })






