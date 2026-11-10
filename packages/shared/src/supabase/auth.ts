import { createClient as createServerClient } from "./server"
import type { Database } from "./types"

export type UserRole = Database["public"]["Enums"]["user_role"]

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]

export type AuthUser = {
  id: string
  email: string | undefined
}

export type AuthenticatedProfile = {
  user: AuthUser
  profile: Profile
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AuthError"
  }
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const supabase = await createServerClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) return null

  return {
    id: data.user.id,
    email: data.user.email,
  }
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle()

  if (error) {
    throw new AuthError(error.message)
  }

  return data
}

export async function getAuthenticatedProfile(): Promise<AuthenticatedProfile | null> {
  const user = await getAuthUser()
  if (!user) return null

  const profile = await getProfile(user.id)
  if (!profile) return null

  return { user, profile }
}

export async function requireAuthenticatedProfile(): Promise<AuthenticatedProfile> {
  const session = await getAuthenticatedProfile()
  if (!session) {
    throw new AuthError("Authentication required")
  }
  return session
}

export async function requireCoachProfile(): Promise<AuthenticatedProfile> {
  const session = await requireAuthenticatedProfile()
  if (session.profile.role !== "coach") {
    throw new AuthError("Coach access required")
  }
  return session
}

export async function requireClientProfile(): Promise<AuthenticatedProfile> {
  const session = await requireAuthenticatedProfile()
  if (session.profile.role !== "client") {
    throw new AuthError("Client access required")
  }
  return session
}

export async function clientHasActiveCoach(clientId: string): Promise<boolean> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("coach_clients")
    .select("id")
    .eq("client_id", clientId)
    .eq("status", "active")
    .maybeSingle()

  if (error) {
    throw new AuthError(error.message)
  }

  return Boolean(data)
}
