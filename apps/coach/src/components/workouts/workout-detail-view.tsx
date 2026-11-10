"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Pencil, UserPlus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { AssignClientsDialog } from "@/components/workouts/assign-clients-dialog"
import { WorkoutStatusBadge } from "@/components/workouts/workout-status-badge"
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
import { initialClients } from "@formfit/shared/clients-data"
import {
  type WorkoutPlan,
  countExercises,
  countTrainingDays,
} from "@formfit/shared/workouts-data"

export function WorkoutDetailView({ plan }: { plan: WorkoutPlan }) {
  const router = useRouter()
  const { assignClients, getPlan } = useWorkouts()
  const [assignOpen, setAssignOpen] = useState(false)
  const currentPlan = getPlan(plan.id) ?? plan

  const assignedClients = initialClients.filter((client) =>
    currentPlan.assignedClientIds.includes(client.id)
  )

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/workouts" />}
            className="w-fit"
          >
            <ArrowLeft className="size-4" />
            Back to workouts
          </Button>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-semibold tracking-tight">
                {currentPlan.name}
              </h2>
              <WorkoutStatusBadge status={currentPlan.status} />
            </div>
            <p className="text-sm text-muted-foreground">{currentPlan.goal}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setAssignOpen(true)}>
            <UserPlus className="size-4" />
            Assign to Clients
          </Button>
          <Button
            onClick={() => router.push(`/workouts/${currentPlan.id}/edit`)}
          >
            <Pencil className="size-4" />
            Edit
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-none">
          <CardContent className="pt-1">
            <p className="text-sm text-muted-foreground">Training days</p>
            <p className="mt-2 text-2xl font-semibold">
              {countTrainingDays(currentPlan)}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardContent className="pt-1">
            <p className="text-sm text-muted-foreground">Exercises</p>
            <p className="mt-2 text-2xl font-semibold">
              {countExercises(currentPlan)}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardContent className="pt-1">
            <p className="text-sm text-muted-foreground">Assigned clients</p>
            <p className="mt-2 text-2xl font-semibold">
              {currentPlan.assignedClientIds.length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>{currentPlan.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Target days per week: {currentPlan.daysPerWeek}
          </p>
          {assignedClients.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {assignedClients.map((client) => (
                <Badge key={client.id} variant="secondary">
                  {client.fullName}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Not assigned to any clients yet.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        {currentPlan.days.map((day) => (
          <Card key={day.id} className="shadow-none">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base">
                    {day.name} — {day.focus}
                  </CardTitle>
                  <CardDescription>
                    {day.isRestDay
                      ? "Recovery day"
                      : `${day.exercises.length} exercises`}
                  </CardDescription>
                </div>
                {day.isRestDay ? <Badge variant="secondary">Rest</Badge> : null}
              </div>
            </CardHeader>
            {!day.isRestDay ? (
              <CardContent className="space-y-2">
                {day.exercises.map((exercise) => (
                  <div
                    key={exercise.id}
                    className="rounded-lg border border-border px-3 py-2"
                  >
                    <p className="text-sm font-medium">{exercise.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {exercise.muscleGroup} · {exercise.sets} sets ·{" "}
                      {exercise.reps} reps · {exercise.restSeconds}s rest
                    </p>
                    {exercise.notes ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {exercise.notes}
                      </p>
                    ) : null}
                  </div>
                ))}
              </CardContent>
            ) : null}
          </Card>
        ))}
      </div>

      <AssignClientsDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        plan={currentPlan}
        onConfirm={(clientIds) => {
          assignClients(currentPlan.id, clientIds)
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
