import { redirect } from "next/navigation"

import { getAuthenticatedProfile } from "@formfit/shared/supabase/auth"

export const instant = false

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getAuthenticatedProfile()

  if (session?.profile.role === "coach") {
    redirect("/")
  }

  return children
}
