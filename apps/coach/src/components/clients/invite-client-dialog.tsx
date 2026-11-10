"use client"

import { AuthForm } from "@/components/auth/auth-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@formfit/ui/dialog"

import { inviteClient } from "@/lib/auth-actions"

type InviteClientDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InviteClientDialog({
  open,
  onOpenChange,
}: InviteClientDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite client</DialogTitle>
          <DialogDescription>
            Send a secure invitation. The client chooses their password when they
            accept. Invitations expire in 7 days and can only be used once.
          </DialogDescription>
        </DialogHeader>
        <AuthForm
          action={inviteClient}
          submitLabel="Create invitation"
          fields={[
            {
              name: "fullName",
              label: "Client name",
              autoComplete: "name",
              placeholder: "Jordan Client",
            },
            {
              name: "email",
              label: "Client email",
              type: "email",
              autoComplete: "email",
              placeholder: "jordan@email.com",
            },
          ]}
        />
      </DialogContent>
    </Dialog>
  )
}
