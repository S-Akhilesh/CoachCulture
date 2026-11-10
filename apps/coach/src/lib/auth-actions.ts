"use server"

import { redirect } from "next/navigation"

import { requireCoachProfile } from "@formfit/shared/supabase/auth"
import {
  isEmailConfirmed,
  requireEmailConfirmation,
  unconfirmedEmailMessage,
} from "@formfit/shared/supabase/email-policy"
import {
  generateInviteToken,
  hashInviteToken,
  inviteExpiresAt,
  validateEmail,
  validatePassword,
} from "@formfit/shared/supabase/invitations"
import {
  adminCreateAuthUser,
  adminFindPendingInvitation,
  adminFindProfileByEmail,
  adminClientHasAnyCoach,
  adminInsertInvitation,
  adminSetUserRole,
  adminUpdateProfileName,
} from "@formfit/shared/supabase/provisioning"
import {
  enforceRateLimit,
  getRequestClientKey,
} from "@formfit/shared/supabase/rate-limit"
import { createClient } from "@formfit/shared/supabase/server"

import { getClientAppUrl } from "@/lib/app-urls"

export type AuthActionState = {
  error?: string
  success?: string
  inviteUrl?: string
}

function getSiteOrigin() {
  return (
    process.env.NEXT_PUBLIC_COACH_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  )
}

function getCoachOnboardingSecret(): string | null {
  const secret = process.env.COACH_ONBOARDING_SECRET?.trim()
  return secret || null
}

export async function signUpCoach(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const fullName = String(formData.get("fullName") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "")
  const confirmPassword = String(formData.get("confirmPassword") ?? "")
  const onboardingSecret = String(formData.get("onboardingSecret") ?? "")
  const clientKey = await getRequestClientKey()

  const rate = await enforceRateLimit({
    bucket: "coach_signup",
    subjects: [email, clientKey],
  })
  if (!rate.ok) return { error: rate.error }

  if (!fullName) return { error: "Full name is required." }

  const emailError = validateEmail(email)
  if (emailError) return { error: emailError }

  const passwordError = validatePassword(password)
  if (passwordError) return { error: passwordError }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." }
  }

  const expectedSecret = getCoachOnboardingSecret()
  if (!expectedSecret) {
    return {
      error:
        "Coach self-registration is disabled. An administrator must bootstrap the first coach account.",
    }
  }

  if (onboardingSecret !== expectedSecret) {
    return { error: "Invalid onboarding secret." }
  }

  const mustConfirm = requireEmailConfirmation()

  try {
    const existing = await adminFindProfileByEmail(email)
    if (existing) {
      return { error: "An account with this email already exists." }
    }

    // Never auto-confirm in production. Dev may confirm immediately for inbox-free testing.
    const user = await adminCreateAuthUser({
      email,
      password,
      fullName,
      emailConfirm: !mustConfirm,
    })

    await adminSetUserRole(user.id, "coach")
    await adminUpdateProfileName(user.id, fullName)

    const origin = getSiteOrigin()
    const supabase = await createClient()

    if (mustConfirm) {
      await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${origin}/auth/callback?next=/`,
        },
      })
      return {
        success:
          "Coach account created. Check your email to verify, then sign in.",
      }
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      return {
        success:
          "Coach account created. Sign in from the login page to continue.",
      }
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create coach account."
    return { error: message }
  }

  redirect("/")
}

export async function signInCoach(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "")
  const clientKey = await getRequestClientKey()

  const rate = await enforceRateLimit({
    bucket: "login",
    subjects: [email, clientKey],
  })
  if (!rate.ok) return { error: rate.error }

  const emailError = validateEmail(email)
  if (emailError) return { error: emailError }
  if (!password) return { error: "Password is required." }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    const message = error.message.toLowerCase()
    if (message.includes("email not confirmed") || message.includes("not confirmed")) {
      return { error: unconfirmedEmailMessage() }
    }
    return { error: error.message }
  }

  if (!data.user) {
    return { error: "Unable to sign in." }
  }

  if (requireEmailConfirmation() && !isEmailConfirmed(data.user)) {
    await supabase.auth.signOut()
    return { error: unconfirmedEmailMessage() }
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle()

  if (profileError || !profile) {
    await supabase.auth.signOut()
    return { error: "Profile not found." }
  }

  if (profile.role !== "coach") {
    await supabase.auth.signOut()
    return {
      error: "This account is not a coach. Use the Client Portal instead.",
    }
  }

  redirect("/")
}

export async function requestPasswordReset(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const clientKey = await getRequestClientKey()

  const rate = await enforceRateLimit({
    bucket: "password_reset",
    subjects: [email, clientKey],
  })
  if (!rate.ok) return { error: rate.error }

  const emailError = validateEmail(email)
  if (emailError) return { error: emailError }

  const supabase = await createClient()
  const origin = getSiteOrigin()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/auth/update-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return {
    success: "If an account exists for that email, a reset link has been sent.",
  }
}

export async function updatePassword(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const password = String(formData.get("password") ?? "")
  const confirmPassword = String(formData.get("confirmPassword") ?? "")

  const passwordError = validatePassword(password)
  if (passwordError) return { error: passwordError }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Session expired. Request a new reset link." }
  }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: error.message }
  }

  redirect("/")
}

export async function signOutCoach() {
  const supabase = await createClient()
  await supabase.auth.signOut({ scope: "global" })
  redirect("/login")
}

export async function inviteClient(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const fullName = String(formData.get("fullName") ?? "").trim()

  const emailError = validateEmail(email)
  if (emailError) return { error: emailError }
  if (!fullName) return { error: "Client name is required." }

  let coach
  try {
    coach = await requireCoachProfile()
  } catch {
    return { error: "Coach authentication required." }
  }

  const rate = await enforceRateLimit({
    bucket: "invite_create",
    subjects: [coach.user.id, email],
  })
  if (!rate.ok) return { error: rate.error }

  try {
    const existingProfile = await adminFindProfileByEmail(email)
    if (existingProfile?.role === "coach") {
      return { error: "That email belongs to a coach account." }
    }

    if (existingProfile) {
      const alreadyLinked = await adminClientHasAnyCoach(existingProfile.id)
      if (alreadyLinked) {
        return {
          error: "This client is already linked to a coach.",
        }
      }
    }

    const pending = await adminFindPendingInvitation(coach.user.id, email)
    if (pending) {
      return { error: "A pending invitation already exists for this email." }
    }

    const token = generateInviteToken()
    await adminInsertInvitation({
      coach_id: coach.user.id,
      email,
      full_name: fullName,
      token_hash: hashInviteToken(token),
      expires_at: inviteExpiresAt().toISOString(),
      status: "pending",
    })

    const inviteUrl = `${getClientAppUrl()}/invite/${token}`

    return {
      success:
        "Invitation created. Share the secure link with your client (single-use, expires in 7 days).",
      inviteUrl,
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create invitation."
    return { error: message }
  }
}
