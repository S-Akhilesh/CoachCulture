import "server-only"

import { createHash } from "node:crypto"

import { createAdminClient } from "./admin"

export type RateLimitBucket =
  | "login"
  | "coach_signup"
  | "password_reset"
  | "invite_create"
  | "invite_accept"

type RateLimitConfig = {
  limit: number
  windowSeconds: number
}

const DEFAULTS: Record<RateLimitBucket, RateLimitConfig> = {
  login: { limit: 20, windowSeconds: 15 * 60 },
  coach_signup: { limit: 5, windowSeconds: 60 * 60 },
  password_reset: { limit: 5, windowSeconds: 60 * 60 },
  invite_create: { limit: 30, windowSeconds: 60 * 60 },
  invite_accept: { limit: 20, windowSeconds: 60 * 60 },
}

function subjectHash(parts: string[]): string {
  return createHash("sha256")
    .update(parts.join("|"), "utf8")
    .digest("hex")
}

/**
 * Durable rate limit using Postgres (`auth_rate_limits`) via service role.
 * Suitable for multi-instance deployments. Requires migration
 * `20261110150000_auth_rate_limits.sql` (do not auto-push).
 *
 * If the table is missing:
 * - development: allow and warn once
 * - production: deny (fail closed)
 */
export async function enforceRateLimit(input: {
  bucket: RateLimitBucket
  subjects: string[]
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const config = DEFAULTS[input.bucket]
  const hash = subjectHash([
    input.bucket,
    ...input.subjects.map((s) => s.trim().toLowerCase()),
  ])
  const since = new Date(Date.now() - config.windowSeconds * 1000).toISOString()

  try {
    const admin = createAdminClient()
    // Table types land after migration + supabase:types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const table = (admin as any).from("auth_rate_limits")

    const { count, error: countError } = await table
      .select("id", { count: "exact", head: true })
      .eq("bucket", input.bucket)
      .eq("subject_hash", hash)
      .gte("created_at", since)

    if (countError) {
      return handleMissingTable(countError)
    }

    if ((count ?? 0) >= config.limit) {
      return {
        ok: false,
        error: "Too many attempts. Please wait and try again.",
      }
    }

    const { error: insertError } = await table.insert({
      bucket: input.bucket,
      subject_hash: hash,
    })

    if (insertError) {
      return handleMissingTable(insertError)
    }

    return { ok: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : "rate limit error"
    if (/auth_rate_limits|schema cache|does not exist/i.test(message)) {
      return handleMissingTable({ message })
    }
    if (process.env.NODE_ENV === "production") {
      return { ok: false, error: "Unable to process request. Try again later." }
    }
    return { ok: true }
  }
}

let warnedMissingTable = false

function handleMissingTable(error: {
  message: string
  code?: string
}): { ok: true } | { ok: false; error: string } {
  const missing =
    /auth_rate_limits|schema cache|does not exist|Could not find the table/i.test(
      error.message
    ) ||
    error.code === "42P01" ||
    error.code === "PGRST205"

  if (!missing) {
    if (process.env.NODE_ENV === "production") {
      return { ok: false, error: "Unable to process request. Try again later." }
    }
    return { ok: true }
  }

  if (!warnedMissingTable) {
    warnedMissingTable = true
    console.warn(
      "[formfit] auth_rate_limits table missing. Apply migration 20261110150000_auth_rate_limits.sql. " +
        (process.env.NODE_ENV === "production"
          ? "Failing closed in production."
          : "Allowing requests in development.")
    )
  }

  if (process.env.NODE_ENV === "production") {
    return {
      ok: false,
      error: "Authentication temporarily unavailable. Contact support.",
    }
  }

  return { ok: true }
}

export async function getRequestClientKey(): Promise<string> {
  try {
    const { headers } = await import("next/headers")
    const headerStore = await headers()
    const forwarded = headerStore.get("x-forwarded-for")
    if (forwarded) {
      return forwarded.split(",")[0]?.trim() || "unknown"
    }
    return headerStore.get("x-real-ip")?.trim() || "unknown"
  } catch {
    return "unknown"
  }
}
