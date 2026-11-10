"use server"

import { redirect } from "next/navigation"

import {
  isEmailConfirmed,
  requireEmailConfirmation,
  unconfirmedEmailMessage,
} from "@formfit/shared/supabase/email-policy"
import {
  hashInviteToken,
  isInviteExpired,
  validateEmail,
  validatePassword,
} from "@formfit/shared/supabase/invitations"
import {
  adminClientHasAnyCoach,
  adminCreateAuthUser,
  adminCreateCoachClientLink,
  adminFindInvitationByTokenHash,
  adminFindProfileByEmail,
  adminMarkInvitationAccepted,
  adminMarkInvitationExpired,
  adminUpdateProfileName,
} from "@formfit/shared/supabase/provisioning"
import {
  enforceRateLimit,
  getRequestClientKey,
} from "@formfit/shared/supabase/rate-limit"
import { createClient } from "@formfit/shared/supabase/server"

export type AuthActionState = {
  error?: string
  success?: string
}

function getSiteOrigin() {
  return (
    process.env.NEXT_PUBLIC_CLIENT_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3001"
  )
}

function isNextRedirect(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
  )
}

export async function signInClient(
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

  if (profile.role !== "client") {
    await supabase.auth.signOut()
    return {
      error: "This account is not a client. Use the Coach Portal instead.",
    }
  }

  const { data: link, error: linkError } = await supabase
    .from("coach_clients")
    .select("id")
    .eq("client_id", data.user.id)
    .eq("status", "active")
    .maybeSingle()

  if (linkError) {
    await supabase.auth.signOut()
    return { error: linkError.message }
  }

  if (!link) {
    await supabase.auth.signOut()
    return {
      error:
        "No active coach relationship found. Ask your coach for a new invitation.",
    }
  }

  redirect(`/${data.user.id}`)
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

  redirect(`/${user.id}`)
}

export async function signOutClient() {
  const supabase = await createClient()
  await supabase.auth.signOut({ scope: "global" })
  redirect("/login")
}

export async function acceptClientInvitation(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const token = String(formData.get("token") ?? "").trim()
  const password = String(formData.get("password") ?? "")
  const confirmPassword = String(formData.get("confirmPassword") ?? "")
  const fullName = String(formData.get("fullName") ?? "").trim()
  const clientKey = await getRequestClientKey()

  const rate = await enforceRateLimit({
    bucket: "invite_accept",
    subjects: [token.slice(0, 16), clientKey],
  })
  if (!rate.ok) return { error: rate.error }

  if (!token) {
    return { error: "Invitation token is missing." }
  }

  const passwordError = validatePassword(password)
  if (passwordError) return { error: passwordError }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." }
  }

  let userId: string

  try {
    const invitation = await adminFindInvitationByTokenHash(
      hashInviteToken(token)
    )

    if (!invitation) {
      return { error: "This invitation is invalid." }
    }

    if (invitation.status === "accepted") {
      return { error: "This invitation has already been used." }
    }

    if (invitation.status === "revoked") {
      return { error: "This invitation was revoked." }
    }

    if (
      invitation.status === "expired" ||
      isInviteExpired(invitation.expires_at)
    ) {
      if (invitation.status === "pending") {
        await adminMarkInvitationExpired(invitation.id)
      }
      return {
        error: "This invitation has expired. Ask your coach for a new one.",
      }
    }

    if (invitation.status !== "pending") {
      return { error: "This invitation cannot be accepted." }
    }

    const email = invitation.email
    const name = fullName || invitation.full_name || email
    const existing = await adminFindProfileByEmail(email)

    if (existing) {
      if (existing.role !== "client") {
        return { error: "This email belongs to a coach account." }
      }

      const alreadyLinked = await adminClientHasAnyCoach(existing.id)
      if (alreadyLinked) {
        return { error: "This client is already linked to a coach." }
      }

      const supabase = await createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error || !data.user) {
        return {
          error:
            "An account already exists for this email. Use your existing password to accept the invite.",
        }
      }

      if (requireEmailConfirmation() && !isEmailConfirmed(data.user)) {
        await supabase.auth.signOut()
        return { error: unconfirmedEmailMessage() }
      }

      userId = data.user.id
      if (name) {
        await adminUpdateProfileName(userId, name)
      }
    } else {
      // Coach-vouched invite: confirm email so the client can use the portal
      // immediately after accepting a single-use hashed invite.
      const user = await adminCreateAuthUser({
        email,
        password,
        fullName: name,
        emailConfirm: true,
      })
      userId = user.id
      await adminUpdateProfileName(userId, name)

      const supabase = await createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        return {
          error:
            "Account created but sign-in failed. Try signing in from the login page.",
        }
      }
    }

    await adminCreateCoachClientLink(invitation.coach_id, userId)
    await adminMarkInvitationAccepted(invitation.id, userId)
  } catch (error) {
    if (isNextRedirect(error)) throw error
    const message =
      error instanceof Error ? error.message : "Unable to accept invitation."
    return { error: message }
  }

  redirect(`/${userId}`)
}
