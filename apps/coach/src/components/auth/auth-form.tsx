"use client"

import { useActionState } from "react"
import Link from "next/link"

import { Button } from "@formfit/ui/button"
import { Input } from "@formfit/ui/input"
import { Label } from "@formfit/ui/label"

import type { AuthActionState } from "@/lib/auth-actions"

type Field = {
  name: string
  label: string
  type?: string
  autoComplete?: string
  placeholder?: string
  required?: boolean
}

export function AuthForm({
  action,
  fields,
  submitLabel,
  footer,
  initialState = {},
}: {
  action: (
    prev: AuthActionState,
    formData: FormData
  ) => Promise<AuthActionState>
  fields: Field[]
  submitLabel: string
  footer?: React.ReactNode
  initialState?: AuthActionState
}) {
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <form action={formAction} className="space-y-4">
      {fields.map((field) => (
        <div key={field.name} className="space-y-1.5">
          <Label htmlFor={field.name}>{field.label}</Label>
          <Input
            id={field.name}
            name={field.name}
            type={field.type ?? "text"}
            autoComplete={field.autoComplete}
            placeholder={field.placeholder}
            required={field.required ?? true}
            disabled={pending}
            className="h-10"
          />
        </div>
      ))}

      {state.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
          {state.success}
        </p>
      ) : null}

      {state.inviteUrl ? (
        <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
          <p className="mb-1 font-medium text-foreground">Invitation link</p>
          <Link
            href={state.inviteUrl}
            className="break-all text-primary underline-offset-2 hover:underline"
          >
            {state.inviteUrl}
          </Link>
        </div>
      ) : null}

      <Button type="submit" className="h-10 w-full" disabled={pending}>
        {pending ? "Please wait…" : submitLabel}
      </Button>

      {footer ? <div className="pt-1 text-sm text-muted-foreground">{footer}</div> : null}
    </form>
  )
}
