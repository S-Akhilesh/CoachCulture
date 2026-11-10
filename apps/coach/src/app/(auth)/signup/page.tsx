import Link from "next/link"

import { AuthForm } from "@/components/auth/auth-form"
import { AuthShell } from "@/components/auth/auth-shell"
import { signUpCoach } from "@/lib/auth-actions"

export default function CoachSignupPage() {
  return (
    <AuthShell
      title="Create coach account"
      description="Register with your studio onboarding secret. Roles are never set from the browser."
    >
      <AuthForm
        action={signUpCoach}
        submitLabel="Create coach account"
        fields={[
          {
            name: "fullName",
            label: "Full name",
            autoComplete: "name",
            placeholder: "Alex Coach",
          },
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
            autoComplete: "new-password",
          },
          {
            name: "confirmPassword",
            label: "Confirm password",
            type: "password",
            autoComplete: "new-password",
          },
          {
            name: "onboardingSecret",
            label: "Onboarding secret",
            type: "password",
            autoComplete: "off",
            placeholder: "Provided by your administrator",
          },
        ]}
        footer={
          <p className="text-center">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        }
      />
    </AuthShell>
  )
}
