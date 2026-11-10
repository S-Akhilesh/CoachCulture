"use client"

import { useTransition } from "react"
import { LogOut } from "lucide-react"

import { Button } from "@formfit/ui/button"

import { signOutClient } from "@/lib/auth-actions"

export function SignOutButton() {
  const [pending, startTransition] = useTransition()

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-8 gap-1.5 text-muted-foreground"
      disabled={pending}
      onClick={() => startTransition(() => signOutClient())}
    >
      <LogOut className="size-3.5" />
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  )
}
