import { redirect } from "next/navigation"

import { getAuthUser } from "@formfit/shared/supabase/auth"

import { AuthForm } from "@/components/auth/auth-form"
import { AuthShell } from "@/components/auth/auth-shell"
import { updatePassword } from "@/lib/auth-actions"

export const instant = false

export default async function CoachUpdatePasswordPage() {
  const user = await getAuthUser()
  if (!user) {
    redirect("/login?error=session")
  }

  return (
    <AuthShell
      title="Choose a new password"
      description="Enter a strong password to finish resetting your coach account."
    >
      <AuthForm
        action={updatePassword}
        submitLabel="Update password"
        fields={[
          {
            name: "password",
            label: "New password",
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
      />
    </AuthShell>
  )
}
