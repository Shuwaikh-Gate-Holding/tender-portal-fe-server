import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from '#/server/supabase.server'

export interface User {
  id: string
  email: string
  created_at: string
  isAdmin: boolean
  approved: boolean
}

export interface Category {
  id: number
  name: string
}

export const fetchVendorCategories = createServerFn({
  method: 'GET',
}).handler(async () => {
  const supabase = getSupabaseServerClient()
  const { data, error } = await supabase
    .from('vendor_categories')
    .select('vendor_email, category_id')

  if (error) throw new Error(error.message)

  const vendorCategoriesMapping: Record<string, number[]> = {}
  if (data) {
    for (const vc of data) {
      if (!vendorCategoriesMapping[vc.vendor_email]) {
        vendorCategoriesMapping[vc.vendor_email] = []
      }
      vendorCategoriesMapping[vc.vendor_email].push(vc.category_id)
    }
  }

  return vendorCategoriesMapping
})

export const fetchVendorsData = createServerFn({
  method: 'GET',
}).handler(async () => {
  const supabase = getSupabaseServerClient()
  const { data: adminsData } = await supabase.from('admins').select('email')
  const adminEmails = new Set(
    (adminsData || []).map((a) => a.email.toLowerCase()),
  )
  const { data: vendorsData, error: vendorsError } = await supabase
    .from('vendors')
    .select('*')
    .order('created_at', { ascending: false })

  if (vendorsError) throw new Error(vendorsError.message)

  const { data: categoriesData, error: categoriesError } = await supabase
    .from('categories')
    .select('id, name')
    .order('name')

  if (categoriesError) throw new Error(categoriesError.message)

  const vendorCategoriesMapping = await fetchVendorCategories()

  const users: User[] = (vendorsData || []).map((vendor: any) => ({
    id: vendor.id,
    email: vendor.email,
    created_at: vendor.created_at,
    isAdmin: adminEmails.has(vendor.email.toLowerCase()),
    approved: !!vendor.approved,
  }))

  const categories: Category[] = (categoriesData) || []

  return {
    users,
    categories,
    vendorCategoriesMapping,
  }
})

export const toggleVendorApprovalAction = createServerFn({
  method: 'POST',
})
  .inputValidator((d: { email: string; approved: boolean }) => d)
  .handler(async ({ data: { email, approved } }) => {
    const supabase = getSupabaseServerClient()
    const { error } = await supabase
      .from('vendors')
      .update({ approved: !approved })
      .eq('email', email.toLowerCase())

    if (error) throw new Error(error.message)
    return { success: true }
  })

export const toggleVendorCategoryAction = createServerFn({
  method: 'POST',
})
  .inputValidator(
    (d: { vendorEmail: string; categoryId: number; hasCategory: boolean }) => d,
  )
  .handler(async ({ data: { vendorEmail, categoryId, hasCategory } }) => {
    const supabase = getSupabaseServerClient()
    if (hasCategory) {
      await supabase
        .from('vendor_categories')
        .delete()
        .eq('vendor_email', vendorEmail)
        .eq('category_id', categoryId)
    } else {
      await supabase
        .from('vendor_categories')
        .insert([{ vendor_email: vendorEmail, category_id: categoryId }])
    }
    return { success: true }
  })

export const addVendorAction = createServerFn({
  method: 'POST',
})
  .inputValidator((d: { email: string; approved: boolean }) => d)
  .handler(async ({ data: { email, approved } }) => {
    const supabase = getSupabaseServerClient()
    const { error } = await supabase
      .from('vendors')
      .insert([{ email: email.toLowerCase(), approved }])

    if (error) throw new Error(error.message)
    return { success: true }
  })






