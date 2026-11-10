"use client"

import { Bell, Menu, Search } from "lucide-react"

import { usePageHeader } from "@/components/dashboard/page-header-context"
import { Avatar, AvatarFallback } from "@formfit/ui/avatar"
import { Button } from "@formfit/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@formfit/ui/dropdown-menu"
import { Input } from "@formfit/ui/input"
import { coach } from "@formfit/shared/mock-data"

type HeaderProps = {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { title, description, actions } = usePageHeader()

  return (
    <header className="z-30 shrink-0 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <Button
              variant="outline"
              size="icon"
              className="mt-0.5 lg:hidden"
              onClick={onMenuClick}
              aria-label="Open navigation"
            >
              <Menu className="size-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                {title}
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {actions}

            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search clients, plans..."
                className="h-9 w-64 bg-muted/40 pl-8"
              />
            </div>

            <Button
              variant="outline"
              size="icon"
              className="relative"
              aria-label="Notifications"
            >
              <Bell className="size-4" />
              <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger
                className="inline-flex size-8 items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                aria-label="Open profile menu"
              >
                <Avatar size="sm">
                  <AvatarFallback className="bg-primary/15 text-primary">
                    {coach.initials}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{coach.name}</p>
                  <p className="text-xs text-muted-foreground">{coach.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Account settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="relative md:hidden">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search clients, plans..."
            className="h-9 bg-muted/40 pl-8"
          />
        </div>
      </div>
    </header>
  )
}
