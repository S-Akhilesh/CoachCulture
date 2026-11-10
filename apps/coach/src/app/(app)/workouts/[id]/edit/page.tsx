"use client"

import { use } from "react"
import Link from "next/link"

import { WorkoutBuilder } from "@/components/workouts/workout-builder"
import { useWorkouts } from "@/components/workouts/workouts-context"
import { Button } from "@formfit/ui/button"

export default function EditWorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { getPlan, isReady } = useWorkouts()
  const plan = getPlan(id)

  if (!isReady) {
    return (
      <div className="mx-auto flex w-full max-w-3xl items-center justify-center py-16 text-sm text-muted-foreground">
        Loading workout...
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col items-start gap-4 py-16">
        <h2 className="text-xl font-semibold">Workout plan not found</h2>
        <p className="text-sm text-muted-foreground">
          This plan may have been deleted or the link is invalid.
        </p>
        <Button render={<Link href="/workouts" />}>Back to workouts</Button>
      </div>
    )
  }

  return <WorkoutBuilder initialPlan={plan} />
}
