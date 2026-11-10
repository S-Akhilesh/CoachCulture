"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"

import { usePageHeaderActions } from "@/components/dashboard/page-header-context"
import { DietPlansList } from "@/components/diet-plans/diet-plans-list"
import { DietPlansSummary } from "@/components/diet-plans/diet-plans-summary"
import { useDietPlans } from "@/components/diet-plans/diet-plans-context"
import { Button } from "@formfit/ui/button"

export function DietPlansView() {
  const { plans } = useDietPlans()

  const createButton = useMemo(
    () => (
      <Button className="h-9" render={<Link href="/diet-plans/new" />}>
        <Plus className="size-4" />
        Create Diet Plan
      </Button>
    ),
    []
  )

  usePageHeaderActions(createButton)

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <DietPlansSummary plans={plans} />
      <DietPlansList />
    </div>
  )
}
