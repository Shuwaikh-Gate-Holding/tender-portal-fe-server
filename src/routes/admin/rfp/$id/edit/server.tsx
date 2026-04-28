import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from '#/server/supabase.server'

export const fetchRfpForEdit = createServerFn({
  method: 'GET',
})
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data: { id } }) => {
    const supabase = getSupabaseServerClient()

    // Fetch RFP
    const { data: rfp, error: rfpError } = await supabase
      .from('rfps')
      .select('*')
      .eq('id', id)
      .single()

    if (rfpError) throw rfpError

    // Fetch terms
    const { data: termsData } = await supabase
      .from('rfp_terms')
      .select('terms_text')
      .eq('rfp_id', id)
      .maybeSingle()

    return {
      rfp,
      terms: termsData?.terms_text || '',
    }
  })

export const updateRfpAction = createServerFn({
  method: 'POST',
})
  .inputValidator((d: any) => d)
  .handler(async ({ data: rfpData }) => {
    const supabase = getSupabaseServerClient()
    const { id, terms, ...updateData } = rfpData

    // Update RFP
    const updateResponse = await supabase
      .from('rfps')
      .update(updateData)
      .eq('id', id)
    console.log("updateError", updateResponse)
    if (updateResponse.error) throw updateResponse.error

    // Update terms - delete old and insert new
    await supabase.from('rfp_terms').delete().eq('rfp_id', id)

    if (terms && terms.trim()) {
      const { error: termsError } = await supabase.from('rfp_terms').insert([
        {
          rfp_id: id,
          terms_text: terms.trim(),
        },
      ])
      console.log("termsError", termsError)
      if (termsError) throw termsError
    }

    return { success: true }
  })
