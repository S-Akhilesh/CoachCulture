import Link from "next/link"

import { AuthForm } from "@/components/auth/auth-form"
import { AuthShell } from "@/components/auth/auth-shell"
import { requestPasswordReset } from "@/lib/auth-actions"

export default function ClientForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset password"
      description="We will email a reset link if an account exists for that address."
    >
      <AuthForm
        action={requestPasswordReset}
        submitLabel="Send reset link"
        fields={[
          {
            name: "email",
            label: "Email",
            type: "email",
            autoComplete: "email",
          },
        ]}
        footer={
          <p className="text-center">
            <Link href="/login" className="font-medium text-primary hover:underline">
              Back to sign in
            </Link>
          </p>
        }
      />
    </AuthShell>
  )
}
