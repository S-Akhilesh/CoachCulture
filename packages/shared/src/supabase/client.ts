import { createBrowserClient } from "@supabase/ssr"

import { getSupabasePublicConfig } from "./env"
import type { Database } from "./types"

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null =
  null

/**
 * Browser Supabase client for Client Components.
 * createBrowserClient already singletons internally; we also memoize locally.
 */
export function createClient() {
  if (typeof window === "undefined") {
    throw new Error(
      "createClient() from @formfit/shared/supabase/client is browser-only. " +
        "Use @formfit/shared/supabase/server on the server."
    )
  }

  if (browserClient) {
    return browserClient
  }

  const { url, publishableKey } = getSupabasePublicConfig()
  browserClient = createBrowserClient<Database>(url, publishableKey)
  return browserClient
}
