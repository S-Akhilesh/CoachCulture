"use client"

import { useEffect, useMemo, useState } from "react"

import { Avatar, AvatarFallback } from "@formfit/ui/avatar"
import { Button } from "@formfit/ui/button"
import { Checkbox } from "@formfit/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@formfit/ui/dialog"
import { initialClients, getInitials } from "@formfit/shared/clients-data"
import type { WorkoutPlan } from "@formfit/shared/workouts-data"

type AssignClientsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan: WorkoutPlan | null
  onConfirm: (clientIds: string[]) => void
}

export function AssignClientsDialog({
  open,
  onOpenChange,
  plan,
  onConfirm,
}: AssignClientsDialogProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    if (!open || !plan) return
    setSelectedIds(plan.assignedClientIds)
  }, [open, plan])

  const selectedClients = useMemo(
    () =>
      initialClients.filter((client) => selectedIds.includes(client.id)),
    [selectedIds]
  )

  function toggleClient(clientId: string, checked: boolean) {
    setSelectedIds((current) =>
      checked
        ? [...current, clientId]
        : current.filter((id) => id !== clientId)
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign to clients</DialogTitle>
          <DialogDescription>
            {plan
              ? `Choose who should receive “${plan.name}”.`
              : "Choose clients for this workout plan."}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {initialClients.map((client) => {
            const checked = selectedIds.includes(client.id)

            return (
              <label
                key={client.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2.5 hover:bg-muted/40"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(value) =>
                    toggleClient(client.id, value === true)
                  }
                />
                <Avatar size="sm">
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
              </label>
            )
          })}
        </div>

        {selectedClients.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            Selected:{" "}
            {selectedClients.map((client) => client.fullName).join(", ")}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            No clients selected yet.
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onConfirm(selectedIds)
              onOpenChange(false)
            }}
          >
            Confirm assignment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
