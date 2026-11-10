"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"

import { usePageHeaderActions } from "@/components/dashboard/page-header-context"
import { WorkoutsList } from "@/components/workouts/workouts-list"
import { WorkoutsSummary } from "@/components/workouts/workouts-summary"
import { useWorkouts } from "@/components/workouts/workouts-context"
import { Button } from "@formfit/ui/button"

export function WorkoutsView() {
  const { plans, isReady } = useWorkouts()

  const createButton = useMemo(
    () => (
      <Button className="h-9" render={<Link href="/workouts/new" />}>
        <Plus className="size-4" />
        Create Workout
      </Button>
    ),
    []
  )

  usePageHeaderActions(createButton)

  if (!isReady) {
    return (
      <div className="mx-auto flex w-full max-w-7xl items-center justify-center py-24 text-sm text-muted-foreground">
        Loading workouts...
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <WorkoutsSummary plans={plans} />
      <WorkoutsList />
    </div>
  )
}
