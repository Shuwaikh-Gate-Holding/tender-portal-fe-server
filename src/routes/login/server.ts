import { createServerFn } from "@tanstack/react-start";
import { getSupabaseServerClient } from "#/server/supabase.server";

export const signinOTPApi = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string }) => d).handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: data.email,
      options: {
        shouldCreateUser: true,
      },
    })
    if (error) {
      return { success: false, error: error.message }
    }
    return { success: true }
  })

export const verifyOTPApi = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string; otp: string }) => d).handler(async ({ data }) => {
    const supabase = getSupabaseServerClient()
    const { data: responseData, error } = await supabase.auth.verifyOtp({
      email: data.email,
      token: data.otp,
      type: 'email',
    })
    if (error) {
      return { success: false, error: error.message }
    }
    return { success: true, isSessionCreated: Boolean(responseData.session) }
  })