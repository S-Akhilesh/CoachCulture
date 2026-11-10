import "server-only"

import { createClient as createSupabaseClient } from "@supabase/supabase-js"

import { getSupabasePublicConfig } from "./env"
import type { Database } from "./types"

/**
 * Service-role Supabase client for trusted server workflows only.
 * Never import this module from Client Components or browser bundles.
 */
export function createAdminClient() {
  const { url } = getSupabasePublicConfig()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not configured. " +
        "Add it to the server environment only (never NEXT_PUBLIC_)."
    )
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
