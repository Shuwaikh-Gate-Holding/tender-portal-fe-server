import { getSupabaseServerClient } from "#/server/supabase.server";
import { createServerFn } from "@tanstack/react-start";

export const logoutUser = createServerFn({ method: "POST" }).handler(async () => {
  const supabase = getSupabaseServerClient()
  await supabase.auth.signOut()
  return { success: true }
})