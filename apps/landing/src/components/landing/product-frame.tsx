import { Activity, Apple, Dumbbell, Users } from "lucide-react"

/**
 * Stylized UI preview based on the real Coach Portal shell —
 * sidebar + content — without fabricated metrics or unavailable features.
 */
export function ProductFrame({
  variant = "coach",
  className,
}: {
  variant?: "coach" | "workout" | "diet" | "client"
  className?: string
}) {
  return (
    <div
      className={
        className ??
        "overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
      }
      aria-hidden={false}
      role="img"
      aria-label={
        variant === "client"
          ? "Preview of the FormFit client portal"
          : "Preview of the FormFit coach studio"
      }
    >
      <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-3 py-2">
        <span className="size-2.5 rounded-full bg-border" />
        <span className="size-2.5 rounded-full bg-border" />
        <span className="size-2.5 rounded-full bg-border" />
        <span className="ml-2 text-xs text-muted-foreground">
          {variant === "client" ? "Client Portal" : "Coach Studio"}
        </span>
      </div>

      <div className="flex min-h-[280px] bg-muted/30 sm:min-h-[340px]">
        <aside className="hidden w-44 shrink-0 border-r border-border bg-sidebar p-3 sm:block">
          <div className="mb-4 flex items-center gap-2 px-1">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Activity className="size-3.5" strokeWidth={2.5} />
            </span>
            <div>
              <p className="text-xs font-semibold">FormFit</p>
              <p className="text-[10px] text-muted-foreground">
                {variant === "client" ? "Client" : "Coach"}
              </p>
            </div>
          </div>
          <ul className="space-y-1 text-xs">
            {(variant === "client"
              ? [
                  { icon: Activity, label: "Home", active: true },
                  { icon: Dumbbell, label: "Workouts", active: false },
                  { icon: Apple, label: "Diet", active: false },
                  { icon: Users, label: "Progress", active: false },
                ]
              : [
                  { icon: Activity, label: "Dashboard", active: variant === "coach" },
                  { icon: Users, label: "Clients", active: false },
                  { icon: Dumbbell, label: "Workouts", active: variant === "workout" },
                  { icon: Apple, label: "Diet Plans", active: variant === "diet" },
                ]
            ).map((item) => {
              const Icon = item.icon
              return (
                <li
                  key={item.label}
                  className={
                    item.active
                      ? "flex items-center gap-2 rounded-lg bg-primary/10 px-2.5 py-2 font-medium text-primary"
                      : "flex items-center gap-2 rounded-lg px-2.5 py-2 text-muted-foreground"
                  }
                >
                  <Icon className="size-3.5 shrink-0" />
                  {item.label}
                </li>
              )
            })}
          </ul>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:p-5">
          {variant === "coach" ? <CoachDashboardPreview /> : null}
          {variant === "workout" ? <WorkoutBuilderPreview /> : null}
          {variant === "diet" ? <DietBuilderPreview /> : null}
          {variant === "client" ? <ClientPortalPreview /> : null}
        </div>
      </div>
    </div>
  )
}

function CoachDashboardPreview() {
  return (
    <>
      <div>
        <p className="text-xs text-muted-foreground">Today</p>
        <p className="text-lg font-semibold tracking-tight">Coach overview</p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {["Clients", "Plans", "Sessions"].map((label) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-background px-3 py-3"
          >
            <p className="text-[11px] text-muted-foreground">{label}</p>
            <div className="mt-2 h-2 w-12 rounded-full bg-primary/20" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-background p-3">
        <p className="text-xs font-medium">Client roster</p>
        <ul className="mt-3 space-y-2">
          {["Maya Chen", "Jordan Blake", "Priya Patel"].map((name) => (
            <li
              key={name}
              className="flex items-center justify-between gap-2 text-xs"
            >
              <span className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-full bg-primary/15 text-[10px] font-medium text-primary">
                  {name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")}
                </span>
                {name}
              </span>
              <span className="text-muted-foreground">Active</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

function WorkoutBuilderPreview() {
  return (
    <>
      <div>
        <p className="text-xs text-muted-foreground">Workout plan</p>
        <p className="text-lg font-semibold tracking-tight">
          Upper / Lower Strength
        </p>
      </div>
      <div className="space-y-2">
        {["Day A — Upper", "Day B — Lower", "Day C — Upper"].map((day, index) => (
          <div
            key={day}
            className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2.5 text-xs"
          >
            <span className="font-medium">{day}</span>
            <span className="text-muted-foreground">
              {index === 0 ? "4 exercises" : "Editing"}
            </span>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-background p-3">
        <p className="text-xs font-medium">Exercise library</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {["Bench Press", "Row", "Overhead Press"].map((item) => (
            <span
              key={item}
              className="rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </>
  )
}

function DietBuilderPreview() {
  return (
    <>
      <div>
        <p className="text-xs text-muted-foreground">Diet plan</p>
        <p className="text-lg font-semibold tracking-tight">
          Muscle gain template
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {["Protein", "Carbs", "Fat"].map((macro) => (
          <div
            key={macro}
            className="rounded-xl border border-border bg-background px-2 py-3 text-center"
          >
            <p className="text-[10px] text-muted-foreground">{macro}</p>
            <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-primary/25" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {["Breakfast", "Lunch", "Dinner"].map((meal) => (
          <div
            key={meal}
            className="rounded-xl border border-border bg-background px-3 py-2.5 text-xs"
          >
            <p className="font-medium">{meal}</p>
            <p className="mt-1 text-muted-foreground">Foods from your library</p>
          </div>
        ))}
      </div>
    </>
  )
}

function ClientPortalPreview() {
  return (
    <>
      <div>
        <p className="text-xs text-muted-foreground">Assigned program</p>
        <p className="text-lg font-semibold tracking-tight">Today&apos;s workout</p>
      </div>
      <div className="rounded-xl border border-border bg-background p-3">
        <p className="text-xs font-medium">Session checklist</p>
        <ul className="mt-3 space-y-2 text-xs">
          {["Warm-up sets", "Working sets", "Cool-down"].map((item, index) => (
            <li key={item} className="flex items-center gap-2">
              <span
                className={
                  index === 0
                    ? "size-4 rounded border border-primary bg-primary/20"
                    : "size-4 rounded border border-border"
                }
              />
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-border bg-background px-3 py-3">
          <p className="text-[11px] text-muted-foreground">Meal log</p>
          <p className="mt-1 text-xs font-medium">Today&apos;s meals</p>
        </div>
        <div className="rounded-xl border border-border bg-background px-3 py-3">
          <p className="text-[11px] text-muted-foreground">Progress</p>
          <p className="mt-1 text-xs font-medium">Measurements</p>
        </div>
      </div>
    </>
  )
}
