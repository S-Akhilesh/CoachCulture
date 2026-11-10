"use client"

import { useTransition } from "react"
import { LogOut } from "lucide-react"

import { Button } from "@formfit/ui/button"

import { signOutCoach } from "@/lib/auth-actions"

export function SignOutButton() {
  const [pending, startTransition] = useTransition()

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="mt-2 h-8 w-full justify-start gap-2 px-1 text-muted-foreground"
      disabled={pending}
      onClick={() => startTransition(() => signOutCoach())}
    >
      <LogOut className="size-3.5" />
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  )
}
