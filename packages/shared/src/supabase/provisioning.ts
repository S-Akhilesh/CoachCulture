import "server-only"

import { createAdminClient } from "./admin"
import type { UserRole } from "./auth"
import type { ClientInvitation, ClientInvitationInsert } from "./invitation-types"

type InvitationsClient = {
  from: (table: "client_invitations") => {
    select: (columns?: string) => {
      eq: (
        column: string,
        value: string
      ) => {
        eq: (
          column: string,
          value: string
        ) => {
          eq: (
            column: string,
            value: string
          ) => {
            maybeSingle: () => Promise<{
              data: ClientInvitation | null
              error: { message: string } | null
            }>
          }
          maybeSingle: () => Promise<{
            data: ClientInvitation | null
            error: { message: string } | null
          }>
        }
        maybeSingle: () => Promise<{
          data: ClientInvitation | null
          error: { message: string } | null
        }>
      }
    }
    insert: (row: ClientInvitationInsert) => {
      select: (columns?: string) => {
        single: () => Promise<{
          data: ClientInvitation | null
          error: { message: string } | null
        }>
      }
    }
    update: (row: Partial<ClientInvitation>) => {
      eq: (
        column: string,
        value: string
      ) => Promise<{ error: { message: string } | null }>
    }
  }
}

function invitations(admin: ReturnType<typeof createAdminClient>) {
  return admin as unknown as InvitationsClient
}

export async function adminSetUserRole(userId: string, role: UserRole) {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc("admin_set_user_role", {
    p_user_id: userId,
    p_role: role,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function adminUpdateProfileName(userId: string, fullName: string) {
  const admin = createAdminClient()
  const { error } = await admin
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", userId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function adminFindProfileByEmail(email: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("profiles")
    .select("*")
    .ilike("email", email.trim().toLowerCase())
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function adminClientHasAnyCoach(clientId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("coach_clients")
    .select("id")
    .eq("client_id", clientId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return Boolean(data)
}

export async function adminCreateCoachClientLink(coachId: string, clientId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("coach_clients")
    .insert({
      coach_id: coachId,
      client_id: clientId,
      status: "active",
    })
    .select("id")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function adminInsertInvitation(row: ClientInvitationInsert) {
  const admin = createAdminClient()
  const { data, error } = await invitations(admin)
    .from("client_invitations")
    .insert(row)
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw new Error("Failed to create invitation")
  }

  return data
}

export async function adminFindInvitationByTokenHash(tokenHash: string) {
  const admin = createAdminClient()
  const { data, error } = await invitations(admin)
    .from("client_invitations")
    .select("*")
    .eq("token_hash", tokenHash)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function adminFindPendingInvitation(coachId: string, email: string) {
  const admin = createAdminClient()
  const { data, error } = await invitations(admin)
    .from("client_invitations")
    .select("*")
    .eq("coach_id", coachId)
    .eq("email", email.trim().toLowerCase())
    .eq("status", "pending")
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function adminMarkInvitationAccepted(
  invitationId: string,
  acceptedBy: string
) {
  const admin = createAdminClient()
  const { error } = await invitations(admin)
    .from("client_invitations")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
      accepted_by: acceptedBy,
    })
    .eq("id", invitationId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function adminMarkInvitationExpired(invitationId: string) {
  const admin = createAdminClient()
  const { error } = await invitations(admin)
    .from("client_invitations")
    .update({ status: "expired" })
    .eq("id", invitationId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function adminCreateAuthUser(input: {
  email: string
  password: string
  fullName: string
  emailConfirm?: boolean
}) {
  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: input.emailConfirm ?? false,
    user_metadata: { full_name: input.fullName },
  })

  if (error) {
    throw new Error(error.message)
  }

  if (!data.user) {
    throw new Error("Failed to create user")
  }

  return data.user
}
