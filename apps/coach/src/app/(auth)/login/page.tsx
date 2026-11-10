import Link from "next/link"

import { AuthForm } from "@/components/auth/auth-form"
import { AuthShell } from "@/components/auth/auth-shell"
import { signInCoach } from "@/lib/auth-actions"

function loginErrorMessage(error?: string) {
  switch (error) {
    case "coach_required":
      return "Coach access required. Client accounts must use the Client Portal."
    case "session":
      return "Your session expired. Please sign in again."
    case "link_expired":
      return "That email link is invalid or expired. Request a new one."
    default:
      return undefined
  }
}

export default async function CoachLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const portalError = loginErrorMessage(params.error)

  return (
    <AuthShell
      title="Coach sign in"
      description="Access your FormFit coach studio to manage clients and programs."
    >
      <AuthForm
        action={signInCoach}
        submitLabel="Sign in"
        initialState={portalError ? { error: portalError } : {}}
        fields={[
          {
            name: "email",
            label: "Email",
            type: "email",
            autoComplete: "email",
            placeholder: "you@studio.com",
          },
          {
            name: "password",
            label: "Password",
            type: "password",
            autoComplete: "current-password",
          },
        ]}
        footer={
          <div className="flex flex-col gap-2 text-center">
            <Link href="/forgot-password" className="text-primary hover:underline">
              Forgot password?
            </Link>
            <p>
              New coach?{" "}
              <Link href="/signup" className="font-medium text-primary hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        }
      />
    </AuthShell>
  )
}
