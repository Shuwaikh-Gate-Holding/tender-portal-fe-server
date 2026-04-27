import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from './supabase.server'

export const acceptRfpTermsAction = createServerFn({
  method: 'POST',
})
  .inputValidator((d: { rfpId: string }) => d)
  .handler(async ({ data: { rfpId } }) => {
    const supabase = getSupabaseServerClient()

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (session?.user?.email === undefined) {
      throw new Error('User not authenticated')
    }

    const { error } = await supabase.from('rfp_invitations').upsert({
      rfp_id: rfpId,
      vendor_email: session.user.email,
      terms_accepted_at: new Date().toISOString(),
    })

    if (error !== null) {
      throw new Error(error.message)
    }

    return { success: true }
  })






