"use client"

import { use } from "react"
import Link from "next/link"

import { DietPlanDetailView } from "@/components/diet-plans/diet-plan-detail-view"
import { useDietPlans } from "@/components/diet-plans/diet-plans-context"
import { Button } from "@formfit/ui/button"

export default function DietPlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { getPlan } = useDietPlans()
  const plan = getPlan(id)

  if (!plan) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col items-start gap-4 py-16">
        <h2 className="text-xl font-semibold">Diet plan not found</h2>
        <p className="text-sm text-muted-foreground">
          This plan may have been deleted or the link is invalid.
        </p>
        <Button render={<Link href="/diet-plans" />}>Back to diet plans</Button>
      </div>
    )
  }

  return <DietPlanDetailView plan={plan} />
}
