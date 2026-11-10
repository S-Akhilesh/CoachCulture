import { createBrowserClient } from "@supabase/ssr"

import {
  SupabaseConfigError,
  getSupabasePublicConfig,
  hasSupabasePublicConfig,
} from "./env"
import type { Database } from "./types"

export type SupabaseHealthResult =
  | {
      ok: true
      configured: true
      message: string
    }
  | {
      ok: false
      configured: boolean
      message: string
    }

/**
 * Verify Supabase public config and that a client can be constructed.
 * Does not query tables (none exist yet) and never logs credentials.
 */
export function checkSupabaseConnection(): SupabaseHealthResult {
  if (!hasSupabasePublicConfig()) {
    return {
      ok: false,
      configured: false,
      message:
        "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    }
  }

  try {
    const { url, publishableKey } = getSupabasePublicConfig()
    const client = createBrowserClient<Database>(url, publishableKey)

    if (!client) {
      return {
        ok: false,
        configured: true,
        message: "Supabase client failed to initialize.",
      }
    }

    return {
      ok: true,
      configured: true,
      message: "Supabase client initialized successfully.",
    }
  } catch (error) {
    const message =
      error instanceof SupabaseConfigError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Unknown Supabase initialization error."

    return {
      ok: false,
      configured: true,
      message,
    }
  }
}
