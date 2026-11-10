/**
 * Email confirmation policy.
 *
 * Development (default): confirmation not required for login so local
 * testing works without inbox access.
 * Production (default): confirmation required for password login.
 *
 * Override with AUTH_REQUIRE_EMAIL_CONFIRMATION=true|false.
 *
 * Client invitation acceptance creates users as email-confirmed because the
 * coach already vouched for the address via a single-use invite token.
 * Public coach self-registration never auto-confirms in production.
 */
export function requireEmailConfirmation(): boolean {
  const override = process.env.AUTH_REQUIRE_EMAIL_CONFIRMATION?.trim().toLowerCase()
  if (override === "true") return true
  if (override === "false") return false
  return process.env.NODE_ENV === "production"
}

export function isEmailConfirmed(user: {
  email_confirmed_at?: string | null
  confirmed_at?: string | null
}): boolean {
  return Boolean(user.email_confirmed_at || user.confirmed_at)
}

export function unconfirmedEmailMessage(): string {
  return "Confirm your email before signing in. Check your inbox for the verification link."
}
