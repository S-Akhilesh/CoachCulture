import { Suspense } from "react"
import { redirect } from "next/navigation"

import { isDemoModeEnabled, isMockClientId } from "@formfit/shared/demo-mode"
import {
  clientHasActiveCoach,
  getAuthenticatedProfile,
} from "@formfit/shared/supabase/auth"

import { PortalClientLayout } from "@/components/portal-client-layout"

export const instant = false

function PortalFallback() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 text-sm text-muted-foreground">
      Loading portal…
    </div>
  )
}

export default async function ClientIdLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ clientId: string }>
}) {
  const { clientId } = await params
  const demoAllowed = isDemoModeEnabled() && isMockClientId(clientId)
  const session = await getAuthenticatedProfile()

  if (session) {
    if (session.profile.role !== "client") {
      redirect("/login?error=client_required")
    }

    // Authenticated users never use mock IDs — always their own UUID.
    if (isMockClientId(clientId) || clientId !== session.user.id) {
      redirect(`/${session.user.id}`)
    }

    const hasCoach = await clientHasActiveCoach(session.user.id)
    if (!hasCoach) {
      redirect("/login?error=no_coach")
    }

    return (
      <Suspense fallback={<PortalFallback />}>
        <PortalClientLayout
          clientId={clientId}
          profile={{
            fullName: session.profile.full_name || "Client",
            email: session.profile.email,
          }}
        >
          {children}
        </PortalClientLayout>
      </Suspense>
    )
  }

  if (!demoAllowed) {
    redirect("/login")
  }

  return (
    <Suspense fallback={<PortalFallback />}>
      <PortalClientLayout clientId={clientId}>{children}</PortalClientLayout>
    </Suspense>
  )
}
