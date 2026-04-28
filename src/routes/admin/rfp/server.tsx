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



export const uploadRfpFiles = createServerFn({ method: "POST" })
  .inputValidator((data) => {
    if (!(data instanceof FormData)) {
      throw new Error('Expected FormData')
    }
    const filePath = data.get('filePath') as string
    const selectedFile = data.get('selectedFile') as File
    if (!filePath || !selectedFile) {
      throw new Error('Missing filePath or selectedFile')
    }
    return { filePath, selectedFile }
  })
  .handler(async ({ data: { filePath, selectedFile } }) => {
    const supabase = getSupabaseServerClient()
    let attachmentUrl;
    const { data: _, error: uploadError } = await supabase.storage
      .from('rfp-files')
      .upload(filePath, selectedFile)

    if (uploadError) {
      console.error('[RFP UPLOAD] Upload error:', uploadError)
      throw new Error(
        `File upload failed: ${uploadError.message}. Please ensure the 'rfp-files' storage bucket exists in Supabase.`,
      )
    } else {
      const { data: urlData } = supabase.storage
        .from('rfp-files')
        .getPublicUrl(filePath)
      attachmentUrl = urlData.publicUrl
    }
    return { attachmentUrl }
  })