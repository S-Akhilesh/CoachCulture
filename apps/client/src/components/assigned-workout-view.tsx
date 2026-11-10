"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { CheckCircle2, Clock, Dumbbell, Play } from "lucide-react"
import { cn } from "cn"

import { usePortal } from "@/components/portal-context"
import { Badge } from "@formfit/ui/badge"
import { Button } from "@formfit/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@formfit/ui/card"
import {
  formatSessionDate,
  getSessionProgress,
  wasDayCompletedToday,
} from "@formfit/shared/portal-data"

export function AssignedWorkoutView() {
  const {
    clientId,
    workoutPlan,
    sessions,
    getInProgressSession,
  } = usePortal()
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null)

  const selectedDay = useMemo(() => {
    if (!workoutPlan) return null
    if (selectedDayId) {
      return workoutPlan.days.find((day) => day.id === selectedDayId) ?? null
    }
    return workoutPlan.days.find((day) => !day.isRestDay) ?? workoutPlan.days[0] ?? null
  }, [workoutPlan, selectedDayId])

  const completedSessions = sessions.filter(
    (session) => session.status === "completed"
  )
  const base = `/${clientId}`

  if (!workoutPlan) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Workouts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your assigned training plan
          </p>
        </div>
        <Card className="shadow-none">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Dumbbell className="size-5 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">No workout plan assigned</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Your coach hasn&apos;t assigned a plan yet. Once they do, you
                can view training days and log sessions here.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const inProgressForSelected = selectedDay
    ? getInProgressSession(selectedDay.id)
    : undefined
  const selectedDone =
    selectedDay != null &&
    wasDayCompletedToday(sessions, selectedDay.id, clientId)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">
            {workoutPlan.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {workoutPlan.goal} · {workoutPlan.daysPerWeek} days/week
          </p>
        </div>
        <Button
            nativeButton={false}
          variant="outline"
          size="sm"
          render={<Link href={`${base}/workouts/history`} />}
        >
          Session history
        </Button>
      </div>

      {workoutPlan.description ? (
        <p className="text-sm leading-relaxed text-muted-foreground">
          {workoutPlan.description}
        </p>
      ) : null}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {workoutPlan.days.map((day) => {
          const active = selectedDay?.id === day.id
          const done = wasDayCompletedToday(sessions, day.id, clientId)
          const inProgress = Boolean(getInProgressSession(day.id))
          return (
            <button
              key={day.id}
              type="button"
              onClick={() => setSelectedDayId(day.id)}
              className={cn(
                "min-w-[7.5rem] shrink-0 rounded-xl border px-3 py-3 text-left transition-colors",
                active
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:bg-muted/50"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{day.name}</p>
                {done ? (
                  <CheckCircle2 className="size-3.5 text-primary" />
                ) : inProgress ? (
                  <Badge className="px-1.5 py-0 text-[10px]">Live</Badge>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{day.focus}</p>
              {day.isRestDay ? (
                <p className="mt-2 text-xs text-muted-foreground">Rest day</p>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">
                  {day.exercises.length} exercises
                </p>
              )}
            </button>
          )
        })}
      </div>

      {selectedDay ? (
        <Card className="shadow-none">
          <CardHeader className="border-b">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>
                  {selectedDay.name} · {selectedDay.focus}
                </CardTitle>
                <CardDescription className="mt-1">
                  {selectedDay.isRestDay
                    ? "Recovery day — no prescribed lifts."
                    : `${selectedDay.exercises.length} exercises`}
                </CardDescription>
              </div>
              {!selectedDay.isRestDay ? (
                <Button
                  nativeButton={false}
                  render={
                    <Link
                      href={`${base}/workouts/session/${selectedDay.id}`}
                    />
                  }
                >
                  <Play data-icon="inline-start" />
                  {inProgressForSelected
                    ? "Continue"
                    : selectedDone
                      ? "Train again"
                      : "Start workout"}
                </Button>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-(--card-spacing)">
            {selectedDay.isRestDay ? (
              <p className="text-sm text-muted-foreground">
                Use this day for mobility, walking, or full rest.
              </p>
            ) : selectedDay.exercises.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No exercises on this day yet.
              </p>
            ) : (
              selectedDay.exercises.map((exercise, index) => (
                <div
                  key={exercise.id}
                  className="rounded-lg border border-border p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">
                        {index + 1}. {exercise.name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {exercise.muscleGroup} · {exercise.equipment}
                      </p>
                    </div>
                    <div className="text-right text-sm tabular-nums">
                      <p className="font-medium">
                        {exercise.sets} × {exercise.reps}
                      </p>
                      <p className="mt-0.5 flex items-center justify-end gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        {exercise.restSeconds}s rest
                      </p>
                    </div>
                  </div>
                  {exercise.notes ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Coach note: {exercise.notes}
                    </p>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ) : null}

      {completedSessions.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-sm font-medium">Recent sessions</h2>
          <div className="space-y-2">
            {completedSessions.slice(0, 5).map((session) => {
              const progress = getSessionProgress(session)
              return (
                <Link
                  key={session.id}
                  href={`${base}/workouts/history/${session.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-3 text-sm transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {session.dayName} · {session.dayFocus}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatSessionDate(
                        session.completedAt ?? session.startedAt
                      )}
                    </p>
                  </div>
                  <Badge variant="secondary">{progress.percent}%</Badge>
                </Link>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
