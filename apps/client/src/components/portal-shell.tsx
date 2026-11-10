"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Apple,
  ArrowLeft,
  Dumbbell,
  Home,
  LineChart,
  Menu,
  X,
} from "lucide-react"
import { useState } from "react"
import { cn } from "cn"

import { SignOutButton } from "@/components/auth/sign-out-button"
import { usePortal } from "@/components/portal-context"
import { Avatar, AvatarFallback } from "@formfit/ui/avatar"
import { Button } from "@formfit/ui/button"
import { getInitials } from "@formfit/shared/clients-data"
import { isDemoModeEnabled, isMockClientId } from "@formfit/shared/demo-mode"
import { getCoachAppUrl } from "@/lib/app-urls"

const navItems = [
  { href: "", label: "Home", icon: Home, match: "exact" as const },
  {
    href: "/workouts",
    label: "Workouts",
    icon: Dumbbell,
    match: "prefix" as const,
  },
  { href: "/diet", label: "Diet", icon: Apple, match: "prefix" as const },
  {
    href: "/progress",
    label: "Progress",
    icon: LineChart,
    match: "prefix" as const,
  },
]

function isActive(
  pathname: string,
  basePath: string,
  href: string,
  match: "exact" | "prefix"
) {
  const full = `${basePath}${href}`
  if (match === "exact") return pathname === full || pathname === `${full}/`
  return pathname === full || pathname.startsWith(`${full}/`)
}

export function PortalShell({ children }: { children: React.ReactNode }) {
  const { client, clientId, isReady } = usePortal()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const basePath = `/${clientId}`
  const isDemoClient = isDemoModeEnabled() && isMockClientId(clientId)

  if (!isReady) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-muted/40 text-sm text-muted-foreground">
        Loading portal…
      </div>
    )
  }

  if (!client) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-muted/40 px-4 text-center">
        <div className="space-y-2">
          <h1 className="text-xl font-medium">Client not found</h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            This client ID is not in the prototype data set.
          </p>
        </div>
        <Button nativeButton={false} render={<a href={getCoachAppUrl()} />}>Back to Coach</Button>
      </div>
    )
  }

  const nav = (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const Icon = item.icon
        const active = isActive(pathname, basePath, item.href, item.match)
        return (
          <Link
            key={item.href || "home"}
            href={`${basePath}${item.href}`}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-muted"
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <div className="flex min-h-svh bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r border-border bg-background md:flex">
        <div className="border-b border-border px-4 py-4">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            FormFit
          </p>
          <p className="mt-1 text-sm font-medium">Client Portal</p>
        </div>

        <div className="flex items-center gap-3 border-b border-border px-4 py-4">
          <Avatar>
            <AvatarFallback className="bg-primary/15 text-primary">
              {getInitials(client.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{client.fullName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {client.fitnessGoal}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">{nav}</div>

        <div className="space-y-2 border-t border-border p-3">
          {isDemoClient ? (
            <Button
              nativeButton={false}
              variant="outline"
              className="w-full justify-start"
              render={<a href={getCoachAppUrl()} />}
            >
              <ArrowLeft data-icon="inline-start" />
              Back to Coach
            </Button>
          ) : (
            <SignOutButton />
          )}
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-foreground/30"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col bg-background shadow-lg">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-medium">Menu</p>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setMobileOpen(false)}
              >
                <X />
              </Button>
            </div>
            <div className="flex items-center gap-3 border-b border-border px-4 py-4">
              <Avatar>
                <AvatarFallback className="bg-primary/15 text-primary">
                  {getInitials(client.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {client.fullName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {client.fitnessGoal}
                </p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3">{nav}</div>
            <div className="space-y-2 border-t border-border p-3">
              {isDemoClient ? (
                <Button
                  nativeButton={false}
                  variant="outline"
                  className="w-full justify-start"
                  render={<a href={getCoachAppUrl()} />}
                >
                  <ArrowLeft data-icon="inline-start" />
                  Back to Coach
                </Button>
              ) : (
                <SignOutButton />
              )}
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur md:hidden">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">FormFit</p>
            <p className="truncate text-xs text-muted-foreground">
              {client.fullName}
            </p>
          </div>
          <Button
            nativeButton={false}
            variant="outline"
            size="sm"
            render={<a href={getCoachAppUrl()} />}
          >
            Coach
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto pb-24 md:pb-8">
          <div className="mx-auto w-full max-w-3xl px-4 py-5 md:px-6 md:py-8">
            {children}
          </div>
        </main>

        {/* Mobile bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background md:hidden">
          <div className="mx-auto grid max-w-3xl grid-cols-4">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(
                pathname,
                basePath,
                item.href,
                item.match
              )
              return (
                <Link
                  key={item.href || "home"}
                  href={`${basePath}${item.href}`}
                  className={cn(
                    "flex flex-col items-center gap-1 px-2 py-2.5 text-[11px] font-medium",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <Icon className="size-5" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </div>
  )
}
