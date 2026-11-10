import Link from "next/link"

import { isDemoModeEnabled } from "@formfit/shared/demo-mode"

import { AuthForm } from "@/components/auth/auth-form"
import { AuthShell } from "@/components/auth/auth-shell"
import { signInClient } from "@/lib/auth-actions"

function loginErrorMessage(error?: string) {
  switch (error) {
    case "client_required":
      return "Client access required. Coach accounts must use the Coach Portal."
    case "no_coach":
      return "No active coach relationship found. Ask your coach for an invitation."
    case "session":
      return "Your session expired. Please sign in again."
    case "link_expired":
      return "That email link is invalid or expired. Request a new one."
    default:
      return undefined
  }
}

export default async function ClientLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const portalError = loginErrorMessage(params.error)
  const showDemoLink = isDemoModeEnabled()

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to view your workouts, nutrition, and progress."
    >
      <AuthForm
        action={signInClient}
        submitLabel="Sign in"
        initialState={portalError ? { error: portalError } : {}}
        fields={[
          {
            name: "email",
            label: "Email",
            type: "email",
            autoComplete: "email",
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
            <p className="text-xs">
              New here? Your coach will send you a secure invitation link.
            </p>
            {showDemoLink ? (
              <p className="text-xs">
                Local demo without auth:{" "}
                <Link href="/demo" className="text-primary hover:underline">
                  open client picker
                </Link>
              </p>
            ) : null}
          </div>
        }
      />
    </AuthShell>
  )
}
