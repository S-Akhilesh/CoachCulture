"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Plus,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { AssignClientsDialog } from "@/components/workouts/assign-clients-dialog"
import { ExerciseEditDialog } from "@/components/workouts/exercise-edit-dialog"
import { ExerciseLibrarySheet } from "@/components/workouts/exercise-library-sheet"
import { useWorkouts } from "@/components/workouts/workouts-context"
import { Badge } from "@formfit/ui/badge"
import { Button } from "@formfit/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@formfit/ui/card"
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
  type WorkoutDay,
  type WorkoutExercise,
  type WorkoutPlan,
  type WorkoutPlanDraft,
  countExercises,
  countTrainingDays,
  createEmptyDraft,
  createExerciseFromLibrary,
  createWorkoutDay,
  dayFocusOptions,
  workoutGoals,
} from "@formfit/shared/workouts-data"

type BuilderStep = 1 | 2 | 3

type WorkoutBuilderProps = {
  initialPlan?: WorkoutPlan
}

function moveItem<T>(items: T[], from: number, to: number) {
  if (to < 0 || to >= items.length) return items
  const next = [...items]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export function WorkoutBuilder({ initialPlan }: WorkoutBuilderProps) {
  const router = useRouter()
  const { savePlan, assignClients } = useWorkouts()
  const [step, setStep] = useState<BuilderStep>(1)
  const [draft, setDraft] = useState<WorkoutPlanDraft>(() =>
    initialPlan
      ? {
          id: initialPlan.id,
          name: initialPlan.name,
          goal: initialPlan.goal,
          description: initialPlan.description,
          daysPerWeek: initialPlan.daysPerWeek,
          status: initialPlan.status,
          days: initialPlan.days,
          assignedClientIds: initialPlan.assignedClientIds,
        }
      : createEmptyDraft()
  )
  const [activeDayId, setActiveDayId] = useState(
    () => draft.days[0]?.id ?? ""
  )
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [editingExercise, setEditingExercise] =
    useState<WorkoutExercise | null>(null)
  const [assignOpen, setAssignOpen] = useState(false)
  const [savedPlan, setSavedPlan] = useState<WorkoutPlan | null>(
    initialPlan ?? null
  )
  const [errors, setErrors] = useState<{ name?: string; days?: string }>({})

  const activeDay = useMemo(
    () => draft.days.find((day) => day.id === activeDayId) ?? draft.days[0],
    [activeDayId, draft.days]
  )

  function updateDay(dayId: string, updater: (day: WorkoutDay) => WorkoutDay) {
    setDraft((current) => ({
      ...current,
      days: current.days.map((day) =>
        day.id === dayId ? updater(day) : day
      ),
    }))
  }

  function validateDetails() {
    const nextErrors: { name?: string; days?: string } = {}
    if (!draft.name.trim()) nextErrors.name = "Plan name is required"
    if (draft.days.length === 0) {
      nextErrors.days = "Add at least one training day"
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function goToStep(nextStep: BuilderStep) {
    if (nextStep > 1 && !validateDetails()) {
      setStep(1)
      return
    }
    setStep(nextStep)
  }

  function handleSave(status: "draft" | "active") {
    if (!validateDetails()) {
      setStep(1)
      toast.error("Add a plan name before saving")
      return
    }

    const saved = savePlan(
      {
        ...draft,
        name: draft.name.trim(),
        description: draft.description.trim(),
        daysPerWeek: Math.max(
          countTrainingDays(draft),
          draft.daysPerWeek || 1
        ),
      },
      status
    )

    setSavedPlan(saved)
    setDraft((current) => ({ ...current, id: saved.id, status: saved.status }))
    toast.success(
      status === "active"
        ? `Published “${saved.name}”`
        : `Saved “${saved.name}” as draft`
    )
    router.push("/workouts")
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="outline"
          size="sm"
          render={<Link href="/workouts" />}
          className="w-fit"
        >
          <ArrowLeft className="size-4" />
          Back to workouts
        </Button>

        <div className="flex flex-wrap gap-2">
          {[
            { id: 1 as const, label: "1. Details" },
            { id: 2 as const, label: "2. Days & exercises" },
            { id: 3 as const, label: "3. Review" },
          ].map((item) => (
            <Button
              key={item.id}
              size="sm"
              variant={step === item.id ? "default" : "outline"}
              onClick={() => goToStep(item.id)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      {step === 1 ? (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Plan details</CardTitle>
            <CardDescription>
              Start with the basics before building training days.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="plan-name">Workout plan name</Label>
              <Input
                id="plan-name"
                value={draft.name}
                onChange={(event) => {
                  setDraft((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                  setErrors((current) => ({ ...current, name: undefined }))
                }}
                placeholder="Upper/Lower Strength A"
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name ? (
                <p className="text-xs text-destructive">{errors.name}</p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Goal</Label>
                <Select
                  value={draft.goal}
                  onValueChange={(value) => {
                    if (!value) return
                    setDraft((current) => ({
                      ...current,
                      goal: value as WorkoutPlanDraft["goal"],
                    }))
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {workoutGoals.map((goal) => (
                      <SelectItem key={goal} value={goal}>
                        {goal}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="days-per-week">Training days per week</Label>
                <Input
                  id="days-per-week"
                  type="number"
                  min={1}
                  max={7}
                  value={draft.daysPerWeek}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      daysPerWeek: Math.min(
                        7,
                        Math.max(1, Number(event.target.value) || 1)
                      ),
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={draft.description}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Who this plan is for, progression notes, scheduling tips..."
                className="min-h-28"
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={() => goToStep(2)}>Continue to days</Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === 2 ? (
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <Card className="h-fit shadow-none">
            <CardHeader className="gap-3">
              <div>
                <CardTitle className="text-base">Training days</CardTitle>
                <CardDescription>
                  Reorder days and switch between them.
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const day = createWorkoutDay(draft.days.length + 1)
                  setDraft((current) => ({
                    ...current,
                    days: [...current.days, day],
                  }))
                  setActiveDayId(day.id)
                }}
              >
                <Plus className="size-4" />
                Add day
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {draft.days.map((day, index) => (
                <div
                  key={day.id}
                  className={`rounded-lg border p-2 ${
                    activeDay?.id === day.id
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => setActiveDayId(day.id)}
                  >
                    <p className="text-sm font-medium">{day.name}</p>
                    <p className="text-xs text-muted-foreground">{day.focus}</p>
                  </button>
                  <div className="mt-2 flex gap-1">
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          days: moveItem(current.days, index, index - 1),
                        }))
                      }
                      aria-label="Move day up"
                    >
                      <ArrowUp className="size-3.5" />
                    </Button>
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          days: moveItem(current.days, index, index + 1),
                        }))
                      }
                      aria-label="Move day down"
                    >
                      <ArrowDown className="size-3.5" />
                    </Button>
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      className="ml-auto text-destructive"
                      onClick={() => {
                        setDraft((current) => {
                          const days = current.days.filter(
                            (item) => item.id !== day.id
                          )
                          if (activeDayId === day.id) {
                            setActiveDayId(days[0]?.id ?? "")
                          }
                          return { ...current, days }
                        })
                      }}
                      aria-label="Remove day"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              {errors.days ? (
                <p className="text-xs text-destructive">{errors.days}</p>
              ) : null}
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">
                {activeDay ? activeDay.name : "Select a day"}
              </CardTitle>
              <CardDescription>
                Configure the day focus and manage exercises.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {activeDay ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label>Day name</Label>
                      <Input
                        value={activeDay.name}
                        onChange={(event) =>
                          updateDay(activeDay.id, (day) => ({
                            ...day,
                            name: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Focus</Label>
                      <Select
                        value={activeDay.focus}
                        onValueChange={(value) => {
                          if (!value) return
                          updateDay(activeDay.id, (day) => ({
                            ...day,
                            focus: String(value),
                            isRestDay: String(value) === "Rest / Recovery",
                            exercises:
                              String(value) === "Rest / Recovery"
                                ? []
                                : day.exercises,
                          }))
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {dayFocusOptions.map((focus) => (
                            <SelectItem key={focus} value={focus}>
                              {focus}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {activeDay.isRestDay ? (
                    <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                      Rest day selected. No exercises needed.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium">
                          Exercises ({activeDay.exercises.length})
                        </p>
                        <Button
                          size="sm"
                          onClick={() => setLibraryOpen(true)}
                        >
                          <Plus className="size-4" />
                          Add exercise
                        </Button>
                      </div>

                      {activeDay.exercises.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                          No exercises yet. Add from the exercise library.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {activeDay.exercises.map((exercise, index) => (
                            <div
                              key={exercise.id}
                              className="rounded-lg border border-border p-3"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium">
                                    {exercise.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {exercise.muscleGroup} · {exercise.equipment}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {exercise.sets} sets · {exercise.reps} reps ·{" "}
                                    {exercise.restSeconds}s rest
                                  </p>
                                  {exercise.notes ? (
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      Note: {exercise.notes}
                                    </p>
                                  ) : null}
                                </div>
                                <div className="flex shrink-0 gap-1">
                                  <Button
                                    size="icon-xs"
                                    variant="ghost"
                                    onClick={() =>
                                      updateDay(activeDay.id, (day) => ({
                                        ...day,
                                        exercises: moveItem(
                                          day.exercises,
                                          index,
                                          index - 1
                                        ),
                                      }))
                                    }
                                    aria-label="Move exercise up"
                                  >
                                    <ArrowUp className="size-3.5" />
                                  </Button>
                                  <Button
                                    size="icon-xs"
                                    variant="ghost"
                                    onClick={() =>
                                      updateDay(activeDay.id, (day) => ({
                                        ...day,
                                        exercises: moveItem(
                                          day.exercises,
                                          index,
                                          index + 1
                                        ),
                                      }))
                                    }
                                    aria-label="Move exercise down"
                                  >
                                    <ArrowDown className="size-3.5" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      setEditingExercise(exercise)
                                    }
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    size="icon-xs"
                                    variant="ghost"
                                    className="text-destructive"
                                    onClick={() =>
                                      updateDay(activeDay.id, (day) => ({
                                        ...day,
                                        exercises: day.exercises.filter(
                                          (item) => item.id !== exercise.id
                                        ),
                                      }))
                                    }
                                    aria-label="Remove exercise"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap justify-between gap-2">
                    <Button variant="outline" onClick={() => goToStep(1)}>
                      Back
                    </Button>
                    <Button onClick={() => goToStep(3)}>
                      Continue to review
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Add a training day to get started.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {step === 3 ? (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Review & save</CardTitle>
            <CardDescription>
              Confirm the plan, then save as draft or publish it.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-lg border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">
                    {draft.name || "Untitled plan"}
                  </h3>
                  <p className="text-sm text-muted-foreground">{draft.goal}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {countTrainingDays(draft)} training days
                  </Badge>
                  <Badge variant="secondary">
                    {countExercises(draft)} exercises
                  </Badge>
                  <Badge variant="secondary">
                    {draft.assignedClientIds.length} assigned
                  </Badge>
                </div>
              </div>
              {draft.description ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  {draft.description}
                </p>
              ) : null}
            </div>

            <div className="space-y-3">
              {draft.days.map((day) => (
                <div
                  key={day.id}
                  className="rounded-lg border border-border p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">
                      {day.name} — {day.focus}
                    </p>
                    {day.isRestDay ? (
                      <Badge variant="secondary">Rest</Badge>
                    ) : (
                      <Badge variant="secondary">
                        {day.exercises.length} exercises
                      </Badge>
                    )}
                  </div>
                  {!day.isRestDay && day.exercises.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {day.exercises.map((exercise) => (
                        <li key={exercise.id}>
                          {exercise.name} · {exercise.sets}×{exercise.reps}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="outline" onClick={() => goToStep(2)}>
                Back to builder
              </Button>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!savedPlan && !draft.id) {
                      const saved = savePlan(
                        {
                          ...draft,
                          name: draft.name.trim() || "Untitled plan",
                        },
                        "draft"
                      )
                      setSavedPlan(saved)
                      setDraft((current) => ({ ...current, id: saved.id }))
                      setAssignOpen(true)
                      return
                    }
                    setAssignOpen(true)
                  }}
                >
                  Assign to Clients
                </Button>
                <Button variant="outline" onClick={() => handleSave("draft")}>
                  Save as Draft
                </Button>
                <Button onClick={() => handleSave("active")}>
                  Publish Workout
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <ExerciseLibrarySheet
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        onSelect={(exercise) => {
          if (!activeDay || activeDay.isRestDay) return
          updateDay(activeDay.id, (day) => ({
            ...day,
            exercises: [...day.exercises, createExerciseFromLibrary(exercise)],
          }))
          toast.success(`Added ${exercise.name}`)
        }}
      />

      <ExerciseEditDialog
        open={Boolean(editingExercise)}
        onOpenChange={(open) => {
          if (!open) setEditingExercise(null)
        }}
        exercise={editingExercise}
        onSave={(exercise) => {
          if (!activeDay) return
          updateDay(activeDay.id, (day) => ({
            ...day,
            exercises: day.exercises.map((item) =>
              item.id === exercise.id ? exercise : item
            ),
          }))
          toast.success(`Updated ${exercise.name}`)
        }}
      />

      <AssignClientsDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        plan={
          savedPlan ??
          (draft.id
            ? {
                ...(draft as WorkoutPlan),
                id: draft.id,
                updatedAt: "",
              }
            : null)
        }
        onConfirm={(clientIds) => {
          const planId = savedPlan?.id ?? draft.id
          if (!planId) {
            const saved = savePlan(
              {
                ...draft,
                name: draft.name.trim() || "Untitled plan",
                assignedClientIds: clientIds,
              },
              draft.status
            )
            setSavedPlan(saved)
            setDraft((current) => ({
              ...current,
              id: saved.id,
              assignedClientIds: clientIds,
            }))
          } else {
            assignClients(planId, clientIds)
            setDraft((current) => ({
              ...current,
              assignedClientIds: clientIds,
            }))
            setSavedPlan((current) =>
              current
                ? { ...current, assignedClientIds: clientIds }
                : current
            )
          }
          toast.success(
            clientIds.length > 0
              ? `Assigned to ${clientIds.length} client${clientIds.length === 1 ? "" : "s"}`
              : "Cleared client assignments"
          )
        }}
      />
    </div>
  )
}
