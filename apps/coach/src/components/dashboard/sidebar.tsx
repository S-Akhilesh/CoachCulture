"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity } from "lucide-react"
import { cn } from "cn"

import { Avatar, AvatarFallback } from "@formfit/ui/avatar"
import { coach, navItems } from "@formfit/shared/mock-data"

import { SignOutButton } from "@/components/auth/sign-out-button"

type SidebarProps = {
  open?: boolean
  onNavigate?: () => void
}

function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  if (href.startsWith("#")) return false
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function Sidebar({ open = false, onNavigate }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-foreground/20 transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onNavigate}
        aria-hidden={!open}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-svh w-64 shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-transform duration-200 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="size-4" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <p className="text-base font-semibold tracking-tight">FormFit</p>
            <p className="text-xs text-muted-foreground">Coach Studio</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const active = isNavActive(pathname, item.href)
            const Icon = item.icon

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 rounded-lg px-1 py-1">
            <Avatar size="sm">
              <AvatarFallback className="bg-primary/15 text-primary">
                {coach.initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{coach.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {coach.role}
              </p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>
    </>
  )
}
