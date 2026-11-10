/**
 * Types for `client_invitations` until the migration is applied and
 * `database.generated.ts` is regenerated.
 */
export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked"

export type ClientInvitation = {
  id: string
  coach_id: string
  email: string
  full_name: string
  token_hash: string
  status: InvitationStatus
  expires_at: string
  accepted_at: string | null
  accepted_by: string | null
  revoked_at: string | null
  created_at: string
  updated_at: string
}

export type ClientInvitationInsert = {
  coach_id: string
  email: string
  full_name: string
  token_hash: string
  status?: InvitationStatus
  expires_at: string
}
