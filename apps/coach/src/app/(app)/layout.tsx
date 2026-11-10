import { Suspense } from "react"
import { redirect } from "next/navigation"

import { getAuthenticatedProfile } from "@formfit/shared/supabase/auth"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"

export const instant = false

function ShellFallback() {
  return <div className="min-h-svh bg-muted/40" />
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getAuthenticatedProfile()

  if (!session) {
    redirect("/login")
  }

  if (session.profile.role !== "coach") {
    redirect("/login?error=coach_required")
  }

  return (
    <Suspense fallback={<ShellFallback />}>
      <DashboardShell>{children}</DashboardShell>
    </Suspense>
  )
}
