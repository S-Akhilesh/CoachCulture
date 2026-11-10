/**
 * Prevent open redirects from auth callback `next` query params.
 * Only same-origin relative paths on an allowlist are accepted.
 */
export function safeAuthRedirectPath(
  next: string | null | undefined,
  allowedExact: readonly string[],
  fallback: string
): string {
  if (!next) return fallback

  const trimmed = next.trim()
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback
  }

  // Reject protocol-relative and encoded tricks
  if (trimmed.includes("://") || trimmed.includes("\\")) {
    return fallback
  }

  const pathOnly = trimmed.split("?")[0]?.split("#")[0] ?? trimmed

  if (allowedExact.includes(pathOnly)) {
    return pathOnly
  }

  return fallback
}

export const COACH_AUTH_REDIRECTS = ["/", "/auth/update-password"] as const
export const CLIENT_AUTH_REDIRECTS = [
  "/login",
  "/auth/update-password",
] as const
