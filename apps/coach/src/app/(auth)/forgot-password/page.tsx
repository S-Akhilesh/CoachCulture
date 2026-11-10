import Link from "next/link"

import { AuthForm } from "@/components/auth/auth-form"
import { AuthShell } from "@/components/auth/auth-shell"
import { requestPasswordReset } from "@/lib/auth-actions"

export default function CoachForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset password"
      description="Enter your coach email and we will send a reset link if an account exists."
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
