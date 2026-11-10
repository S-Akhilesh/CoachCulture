"use client"

import { useEffect, useState } from "react"

import { Button } from "@formfit/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@formfit/ui/dialog"
import { Input } from "@formfit/ui/input"
import { Label } from "@formfit/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@formfit/ui/select"
import { Textarea } from "@formfit/ui/textarea"
import {
  type Client,
  type ClientFormValues,
  type ClientStatus,
  clientToFormValues,
  createEmptyClientFormValues,
  fitnessGoals,
} from "@formfit/shared/clients-data"

type ClientFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  client?: Client | null
  onSubmit: (values: ClientFormValues) => void
}

type FormErrors = Partial<Record<keyof ClientFormValues, string>>

function validate(values: ClientFormValues): FormErrors {
  const errors: FormErrors = {}

  if (!values.fullName.trim()) {
    errors.fullName = "Full name is required"
  }

  if (!values.email.trim()) {
    errors.email = "Email is required"
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Enter a valid email address"
  }

  if (!values.phone.trim()) {
    errors.phone = "Phone number is required"
  }

  if (!values.fitnessGoal) {
    errors.fitnessGoal = "Select a fitness goal"
  }

  if (!values.startDate) {
    errors.startDate = "Start date is required"
  }

  return errors
}

export function ClientFormDialog({
  open,
  onOpenChange,
  client,
  onSubmit,
}: ClientFormDialogProps) {
  const isEditing = Boolean(client)
  const [values, setValues] = useState<ClientFormValues>(
    createEmptyClientFormValues
  )
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (!open) return
    setValues(
      client
        ? clientToFormValues(client)
        : createEmptyClientFormValues(new Date().toISOString().slice(0, 10))
    )
    setErrors({})
  }, [client, open])

  function updateField<K extends keyof ClientFormValues>(
    key: K,
    value: ClientFormValues[K]
  ) {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    onSubmit({
      ...values,
      fullName: values.fullName.trim(),
      email: values.email.trim().toLowerCase(),
      phone: values.phone.trim(),
      notes: values.notes.trim(),
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit client" : "Add client"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this client's profile and coaching details."
              : "Add a new athlete to your coaching roster."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              value={values.fullName}
              onChange={(event) => updateField("fullName", event.target.value)}
              placeholder="Maya Chen"
              aria-invalid={Boolean(errors.fullName)}
            />
            {errors.fullName ? (
              <p className="text-xs text-destructive">{errors.fullName}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={values.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="maya.chen@email.com"
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email ? (
                <p className="text-xs text-destructive">{errors.email}</p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                value={values.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="+1 (415) 555-0142"
                aria-invalid={Boolean(errors.phone)}
              />
              {errors.phone ? (
                <p className="text-xs text-destructive">{errors.phone}</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="fitnessGoal">Fitness goal</Label>
              <Select
                value={values.fitnessGoal}
                onValueChange={(value) => {
                  if (value != null) updateField("fitnessGoal", String(value))
                }}
              >
                <SelectTrigger id="fitnessGoal" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fitnessGoals.map((goal) => (
                    <SelectItem key={goal} value={goal}>
                      {goal}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.fitnessGoal ? (
                <p className="text-xs text-destructive">{errors.fitnessGoal}</p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={values.status}
                onValueChange={(value) => {
                  if (value === "active" || value === "inactive") {
                    updateField("status", value as ClientStatus)
                  }
                }}
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="startDate">Start date</Label>
            <Input
              id="startDate"
              type="date"
              value={values.startDate}
              onChange={(event) => updateField("startDate", event.target.value)}
              aria-invalid={Boolean(errors.startDate)}
            />
            {errors.startDate ? (
              <p className="text-xs text-destructive">{errors.startDate}</p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={values.notes}
              onChange={(event) => updateField("notes", event.target.value)}
              placeholder="Scheduling preferences, injuries, coaching focus..."
              className="min-h-24"
            />
          </div>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? "Save changes" : "Add client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
