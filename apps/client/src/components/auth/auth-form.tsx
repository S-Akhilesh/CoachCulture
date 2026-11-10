"use client"

import { useActionState } from "react"

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
  defaultValue?: string
  readOnly?: boolean
}

export function AuthForm({
  action,
  fields,
  submitLabel,
  footer,
  hiddenFields,
  initialState = {},
}: {
  action: (
    prev: AuthActionState,
    formData: FormData
  ) => Promise<AuthActionState>
  fields: Field[]
  submitLabel: string
  footer?: React.ReactNode
  hiddenFields?: Record<string, string>
  initialState?: AuthActionState
}) {
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <form action={formAction} className="space-y-4">
      {hiddenFields
        ? Object.entries(hiddenFields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))
        : null}

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
            defaultValue={field.defaultValue}
            readOnly={field.readOnly}
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

      <Button type="submit" className="h-10 w-full" disabled={pending}>
        {pending ? "Please wait…" : submitLabel}
      </Button>

      {footer ? <div className="pt-1 text-sm text-muted-foreground">{footer}</div> : null}
    </form>
  )
}
