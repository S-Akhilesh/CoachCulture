import Link from "next/link"
import { redirect } from "next/navigation"

import {
  hashInviteToken,
  isInviteExpired,
} from "@formfit/shared/supabase/invitations"
import {
  adminFindInvitationByTokenHash,
  adminMarkInvitationExpired,
} from "@formfit/shared/supabase/provisioning"

import { AuthForm } from "@/components/auth/auth-form"
import { AuthShell } from "@/components/auth/auth-shell"
import { acceptClientInvitation } from "@/lib/auth-actions"

export const instant = false

export default async function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  if (!token) {
    redirect("/login")
  }

  let errorMessage: string | null = null
  let email = ""
  let fullName = ""

  try {
    const invitation = await adminFindInvitationByTokenHash(
      hashInviteToken(token)
    )

    if (!invitation) {
      errorMessage = "This invitation link is invalid."
    } else if (invitation.status === "accepted") {
      errorMessage = "This invitation has already been used."
    } else if (invitation.status === "revoked") {
      errorMessage = "This invitation was revoked by your coach."
    } else if (
      invitation.status === "expired" ||
      isInviteExpired(invitation.expires_at)
    ) {
      if (invitation.status === "pending") {
        await adminMarkInvitationExpired(invitation.id)
      }
      errorMessage = "This invitation has expired."
    } else if (invitation.status !== "pending") {
      errorMessage = "This invitation cannot be accepted."
    } else {
      email = invitation.email
      fullName = invitation.full_name
    }
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : "Unable to verify this invitation."
  }

  if (errorMessage) {
    return (
      <AuthShell title="Invitation unavailable" description={errorMessage}>
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary hover:underline">
            Go to sign in
          </Link>
        </p>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Join your coach"
      description="Create your FormFit client account to access your personalized program."
    >
      <AuthForm
        action={acceptClientInvitation}
        submitLabel="Accept invitation"
        hiddenFields={{ token }}
        fields={[
          {
            name: "fullName",
            label: "Full name",
            autoComplete: "name",
            defaultValue: fullName,
          },
          {
            name: "email",
            label: "Email",
            type: "email",
            defaultValue: email,
            readOnly: true,
            required: false,
          },
          {
            name: "password",
            label: "Password",
            type: "password",
            autoComplete: "new-password",
          },
          {
            name: "confirmPassword",
            label: "Confirm password",
            type: "password",
            autoComplete: "new-password",
          },
        ]}
        footer={
          <p className="text-center text-xs">
            Already registered? Use your existing password above to link this
            invitation to your account.
          </p>
        }
      />
    </AuthShell>
  )
}
