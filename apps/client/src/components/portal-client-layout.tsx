"use client"

import { PortalProvider } from "@/components/portal-context"
import { PortalShell } from "@/components/portal-shell"

export function PortalClientLayout({
  children,
  clientId,
  profile,
}: {
  children: React.ReactNode
  clientId: string
  profile?: { fullName: string; email: string }
}) {
  return (
    <PortalProvider clientId={clientId} profile={profile}>
      <PortalShell>{children}</PortalShell>
    </PortalProvider>
  )
}
