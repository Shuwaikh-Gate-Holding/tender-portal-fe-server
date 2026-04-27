import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from '#/server/supabase.server'

export interface Category {
  id: number
  name: string
  description: string
}

export const fetchCategories = createServerFn({
  method: 'GET',
}).handler(async () => {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  if (error) throw new Error(error.message)
  return (data as Category[]) || []
})

export const upsertCategoryAction = createServerFn({
  method: 'POST',
})
  .inputValidator((d: { id?: number; name: string; description: string }) => d)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()

    if (data.id) {
      const { error } = await supabase
        .from('categories')
        .update({
          name: data.name,
          description: data.description,
        })
        .eq('id', data.id)

      if (error) throw new Error(error.message)
    } else {
      const { error } = await supabase.from('categories').insert([
        {
          name: data.name,
          description: data.description,
        },
      ])

      if (error) throw new Error(error.message)
    }

    return { success: true }
  })

export const deleteCategoryAction = createServerFn({
  method: 'POST',
})
  .inputValidator((d: { id: number }) => d)
  .handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', data.id)

    if (error) throw new Error(error.message)
    return { success: true }
  })






