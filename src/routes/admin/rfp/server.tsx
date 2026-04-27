import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from '#/server/supabase.server'

export const fetchCategories = createServerFn({
  method: 'GET',
}).handler(async () => {
  const supabase = getSupabaseServerClient()
  const { data } = await supabase
    .from('categories')
    .select('id, name')
    .order('name')
  return data || []
})

export const createRfpAction = createServerFn({
  method: 'POST',
})
  .inputValidator((d: any) => d)
  .handler(async ({ data: rfpData }) => {
    const supabase = getSupabaseServerClient()

    const { terms, ...rfp } = rfpData

    const { data, error: insertError } = await supabase
      .from('rfps')
      .insert([rfp])
      .select()
      .single()

    if (insertError) throw insertError

    // Create terms if provided
    if (terms && terms.trim()) {
      await supabase.from('rfp_terms').insert([
        {
          rfp_id: data.id,
          terms_text: terms.trim(),
        },
      ])
    }

    return data
  })






