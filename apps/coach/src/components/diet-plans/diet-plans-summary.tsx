import { Apple, ClipboardList, FilePenLine } from "lucide-react"

import { Card, CardContent } from "@formfit/ui/card"
import type { DietPlan } from "@formfit/shared/diet-plans-data"

export function DietPlansSummary({ plans }: { plans: DietPlan[] }) {
  const total = plans.length
  const assigned = plans.filter((plan) => plan.assignedClientIds.length > 0)
    .length
  const drafts = plans.filter((plan) => plan.status === "draft").length

  const cards = [
    { title: "Total Diet Plans", value: total, icon: Apple },
    { title: "Assigned Plans", value: assigned, icon: ClipboardList },
    { title: "Draft Plans", value: drafts, icon: FilePenLine },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon

        return (
          <Card key={card.title} className="shadow-none">
            <CardContent className="flex items-start justify-between gap-3">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="text-3xl font-semibold tracking-tight">
                  {card.value}
                </p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
