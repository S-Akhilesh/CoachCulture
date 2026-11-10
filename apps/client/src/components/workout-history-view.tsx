"use client"

import Link from "next/link"
import { ArrowLeft, History } from "lucide-react"

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
  formatSessionTime,
  getSessionProgress,
} from "@formfit/shared/portal-data"

export function WorkoutHistoryList() {
  const { clientId, sessions } = usePortal()
  const completed = sessions.filter((session) => session.status === "completed")
  const inProgress = sessions.filter(
    (session) => session.status === "in_progress"
  )
  const base = `/${clientId}`

  return (
    <div className="space-y-6">
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
        <div>
          <h1 className="text-2xl font-medium tracking-tight">
            Session history
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Past and in-progress workout logs
          </p>
        </div>
      </div>

      {inProgress.length > 0 ? (
        <div className="space-y-2">
          <h2 className="text-sm font-medium">In progress</h2>
          {inProgress.map((session) => (
            <Link
              key={session.id}
              href={`${base}/workouts/session/${session.dayId}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-3 text-sm"
            >
              <div>
                <p className="font-medium">
                  {session.dayName} · {session.dayFocus}
                </p>
                <p className="text-xs text-muted-foreground">
                  Started {formatSessionDate(session.startedAt)}{" "}
                  {formatSessionTime(session.startedAt)}
                </p>
              </div>
              <Badge>Continue</Badge>
            </Link>
          ))}
        </div>
      ) : null}

      {completed.length === 0 ? (
        <Card className="shadow-none">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <History className="size-5 text-muted-foreground" />
            <div className="space-y-1">
              <p className="font-medium">No completed sessions yet</p>
              <p className="text-sm text-muted-foreground">
                Finish a workout to see your logged sets here.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {completed.map((session) => {
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
                    {" · "}
                    {session.planName}
                  </p>
                </div>
                <Badge variant="secondary">{progress.percent}%</Badge>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function WorkoutHistoryDetail({ sessionId }: { sessionId: string }) {
  const { clientId, getSession } = usePortal()
  const session = getSession(sessionId)
  const base = `/${clientId}`

  if (!session) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-medium">Session not found</h1>
        <Button nativeButton={false} render={<Link href={`${base}/workouts/history`} />}>
          Back to history
        </Button>
      </div>
    )
  }

  const progress = getSessionProgress(session)

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Button
            nativeButton={false}
          variant="ghost"
          size="icon-sm"
          className="mt-0.5"
          render={<Link href={`${base}/workouts/history`} />}
        >
          <ArrowLeft />
        </Button>
        <div>
          <h1 className="text-2xl font-medium tracking-tight">
            {session.dayName} · {session.dayFocus}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {session.planName} ·{" "}
            {formatSessionDate(session.completedAt ?? session.startedAt)}
          </p>
        </div>
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>
            {progress.completedSets}/{progress.totalSets} sets logged ·{" "}
            {progress.completedExercises}/{progress.totalExercises} exercises
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="space-y-3">
        {session.exercises.map((exercise) => (
          <Card key={exercise.exerciseId} className="shadow-none" size="sm">
            <CardHeader className="border-b">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>{exercise.name}</CardTitle>
                  <CardDescription>
                    Prescribed {exercise.prescribedSets} ×{" "}
                    {exercise.prescribedReps}
                  </CardDescription>
                </div>
                {exercise.completed ? (
                  <Badge>Done</Badge>
                ) : (
                  <Badge variant="secondary">Partial</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-(--card-spacing)">
              {exercise.sets.map((set) => (
                <div
                  key={set.setNumber}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="text-muted-foreground">
                    Set {set.setNumber}
                  </span>
                  <span className="tabular-nums">
                    {set.actualReps ?? "—"} reps
                    {set.actualWeight != null
                      ? ` × ${set.actualWeight} kg`
                      : ""}
                    {set.completed ? "" : " (skipped)"}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {session.notes ? (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {session.notes}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
