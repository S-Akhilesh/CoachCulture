"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, Check, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"

import { usePortal } from "@/components/portal-context"
import { Badge } from "@formfit/ui/badge"
import { Button } from "@formfit/ui/button"
import { Checkbox } from "@formfit/ui/checkbox"
import { Input } from "@formfit/ui/input"
import { Label } from "@formfit/ui/label"
import { Textarea } from "@formfit/ui/textarea"
import {
  type WorkoutExerciseLog,
  type WorkoutSession,
  type WorkoutSetLog,
  getSessionProgress,
} from "@formfit/shared/portal-data"

function updateSet(
  session: WorkoutSession,
  exerciseId: string,
  setNumber: number,
  patch: Partial<WorkoutSetLog>
): WorkoutSession {
  return {
    ...session,
    exercises: session.exercises.map((exercise) => {
      if (exercise.exerciseId !== exerciseId) return exercise
      const sets = exercise.sets.map((set) =>
        set.setNumber === setNumber ? { ...set, ...patch } : set
      )
      const allDone = sets.every((set) => set.completed)
      return {
        ...exercise,
        sets,
        completed: allDone ? true : exercise.completed && allDone,
      }
    }),
  }
}

function markExerciseComplete(
  session: WorkoutSession,
  exerciseId: string,
  completed: boolean
): WorkoutSession {
  return {
    ...session,
    exercises: session.exercises.map((exercise) => {
      if (exercise.exerciseId !== exerciseId) return exercise
      return {
        ...exercise,
        completed,
        sets: exercise.sets.map((set) => ({
          ...set,
          completed: completed ? true : set.completed,
        })),
      }
    }),
  }
}

function ExerciseCard({
  exercise,
  onChangeSet,
  onToggleExercise,
}: {
  exercise: WorkoutExerciseLog
  onChangeSet: (
    exerciseId: string,
    setNumber: number,
    patch: Partial<WorkoutSetLog>
  ) => void
  onToggleExercise: (exerciseId: string, completed: boolean) => void
}) {
  const doneSets = exercise.sets.filter((set) => set.completed).length

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4",
        exercise.completed && "border-primary/40 bg-primary/5"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{exercise.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Prescribed {exercise.prescribedSets} × {exercise.prescribedReps}
            {" · "}
            {exercise.restSeconds}s rest
          </p>
        </div>
        <Badge variant={exercise.completed ? "default" : "secondary"}>
          {doneSets}/{exercise.sets.length}
        </Badge>
      </div>

      {exercise.coachNotes ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Coach: {exercise.coachNotes}
        </p>
      ) : null}

      <div className="mt-4 space-y-2">
        <div className="grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-2 px-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          <span>Set</span>
          <span>Reps</span>
          <span>kg</span>
          <span className="text-center">Done</span>
        </div>
        {exercise.sets.map((set) => (
          <div
            key={set.setNumber}
            className={cn(
              "grid grid-cols-[2rem_1fr_1fr_2.5rem] items-center gap-2 rounded-lg border border-border px-2 py-2",
              set.completed && "bg-muted/60"
            )}
          >
            <span className="text-center text-sm font-medium tabular-nums">
              {set.setNumber}
            </span>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              className="h-10 text-center text-base tabular-nums"
              value={set.actualReps ?? ""}
              aria-label={`Set ${set.setNumber} reps`}
              onChange={(event) => {
                const value = event.target.value
                onChangeSet(exercise.exerciseId, set.setNumber, {
                  actualReps: value === "" ? null : Number(value),
                })
              }}
            />
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              step={0.5}
              className="h-10 text-center text-base tabular-nums"
              value={set.actualWeight ?? ""}
              placeholder="—"
              aria-label={`Set ${set.setNumber} weight`}
              onChange={(event) => {
                const value = event.target.value
                onChangeSet(exercise.exerciseId, set.setNumber, {
                  actualWeight: value === "" ? null : Number(value),
                })
              }}
            />
            <div className="flex justify-center">
              <Checkbox
                checked={set.completed}
                aria-label={`Mark set ${set.setNumber} complete`}
                onCheckedChange={(checked) =>
                  onChangeSet(exercise.exerciseId, set.setNumber, {
                    completed: checked === true,
                  })
                }
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex justify-end">
        <Button
          variant={exercise.completed ? "secondary" : "outline"}
          size="sm"
          onClick={() =>
            onToggleExercise(exercise.exerciseId, !exercise.completed)
          }
        >
          {exercise.completed ? (
            <>
              <CheckCircle2 data-icon="inline-start" />
              Exercise done
            </>
          ) : (
            <>
              <Check data-icon="inline-start" />
              Mark exercise done
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

export function WorkoutSessionView({ dayId }: { dayId: string }) {
  const router = useRouter()
  const {
    clientId,
    workoutPlan,
    isReady,
    startWorkout,
    updateSession,
    finishWorkout,
    getInProgressSession,
    getSession,
    sessions,
  } = usePortal()

  const day = useMemo(
    () => workoutPlan?.days.find((item) => item.id === dayId) ?? null,
    [workoutPlan, dayId]
  )

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [bootstrapped, setBootstrapped] = useState(false)

  useEffect(() => {
    if (!isReady || !day || day.isRestDay || bootstrapped) return

    const existing =
      getInProgressSession(day.id) ??
      sessions.find(
        (session) =>
          session.dayId === day.id && session.status === "in_progress"
      )

    if (existing) {
      setSessionId(existing.id)
      setBootstrapped(true)
      return
    }

    const created = startWorkout(day)
    if (created) {
      setSessionId(created.id)
    }
    setBootstrapped(true)
  }, [
    isReady,
    day,
    bootstrapped,
    getInProgressSession,
    sessions,
    startWorkout,
  ])

  const session = sessionId ? getSession(sessionId) : undefined
  const progress = session ? getSessionProgress(session) : null
  const base = `/${clientId}`

  if (!isReady || !bootstrapped) {
    return (
      <p className="text-sm text-muted-foreground">Preparing workout…</p>
    )
  }

  if (!workoutPlan || !day) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-medium">Workout not found</h1>
        <Button nativeButton={false} render={<Link href={`${base}/workouts`} />}>
          Back to workouts
        </Button>
      </div>
    )
  }

  if (day.isRestDay) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-medium">Rest day</h1>
        <p className="text-sm text-muted-foreground">
          {day.name} is a recovery day. No session to log.
        </p>
        <Button nativeButton={false} render={<Link href={`${base}/workouts`} />}>
          Back to workouts
        </Button>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-medium">Could not start session</h1>
        <Button nativeButton={false} render={<Link href={`${base}/workouts`} />}>
          Back to workouts
        </Button>
      </div>
    )
  }

  const handleFinish = () => {
    const finishedId = session.id
    finishWorkout(finishedId)
    toast.success("Workout finished")
    // Defer navigation so the completed session is persisted first.
    window.setTimeout(() => {
      router.push(`${base}/workouts/history/${finishedId}`)
    }, 0)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <Button
            nativeButton={false}
          variant="ghost"
          size="icon-sm"
          className="mt-0.5"
          render={<Link href={`${base}/workouts`} />}
        >
          <ArrowLeft />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-medium tracking-tight">
            {session.dayName} · {session.dayFocus}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {session.planName}
            {session.status === "completed" ? " · Completed" : " · In progress"}
          </p>
        </div>
      </div>

      <div className="sticky top-[3.25rem] z-20 -mx-4 space-y-2 border-b border-border bg-muted/30 px-4 py-3 backdrop-blur md:top-0 md:mx-0 md:rounded-xl md:border">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">Workout progress</span>
          <span className="font-medium tabular-nums">
            {progress?.completedSets}/{progress?.totalSets} sets ·{" "}
            {progress?.percent}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${progress?.percent ?? 0}%` }}
          />
        </div>
      </div>

      <div className="space-y-4">
        {session.exercises.map((exercise) => (
          <ExerciseCard
            key={exercise.exerciseId}
            exercise={exercise}
            onChangeSet={(exerciseId, setNumber, patch) =>
              updateSession(updateSet(session, exerciseId, setNumber, patch))
            }
            onToggleExercise={(exerciseId, completed) =>
              updateSession(markExerciseComplete(session, exerciseId, completed))
            }
          />
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="session-notes">Session notes</Label>
        <Textarea
          id="session-notes"
          value={session.notes}
          placeholder="How did the session feel?"
          className="min-h-24"
          onChange={(event) =>
            updateSession({ ...session, notes: event.target.value })
          }
        />
      </div>

      {session.status === "in_progress" ? (
        <div className="sticky bottom-20 z-20 md:static md:bottom-auto">
          <Button className="h-11 w-full text-base" onClick={handleFinish}>
            Finish Workout
          </Button>
        </div>
      ) : (
        <Button
            nativeButton={false}
          variant="outline"
          className="w-full"
          render={<Link href={`${base}/workouts`} />}
        >
          Back to workout plan
        </Button>
      )}
    </div>
  )
}
