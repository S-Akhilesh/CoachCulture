import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import { getSupabasePublicConfig } from "./env"
import type { Database } from "./types"

/**
 * Server Supabase client for Server Components, Route Handlers, and Server Actions.
 * Creates a fresh client per call so request cookies are always current.
 *
 * Cookie writes from Server Components may fail; session refresh is handled by
 * each app's `proxy.ts` via `updateSession`.
 */
export async function createClient() {
  const { url, publishableKey } = getSupabasePublicConfig()
  const cookieStore = await cookies()

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet, _headers) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Called from a Server Component where cookies cannot be set.
          // Safe to ignore when proxy refreshes sessions on each request.
        }
      },
    },
  })
}
