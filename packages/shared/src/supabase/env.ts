export type SupabasePublicConfig = {
  url: string
  publishableKey: string
}

export class SupabaseConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SupabaseConfigError"
  }
}

/**
 * Read and validate the public Supabase env vars used by both apps.
 * Never logs key values.
 */
export function getSupabasePublicConfig(): SupabasePublicConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()

  if (!url || !publishableKey) {
    const missing = [
      !url ? "NEXT_PUBLIC_SUPABASE_URL" : null,
      !publishableKey ? "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" : null,
    ].filter(Boolean)

    throw new SupabaseConfigError(
      `Supabase is not configured. Missing: ${missing.join(", ")}. ` +
        `Add these to the app's .env.local file.`
    )
  }

  return { url, publishableKey }
}

export function hasSupabasePublicConfig(): boolean {
  try {
    getSupabasePublicConfig()
    return true
  } catch {
    return false
  }
}
