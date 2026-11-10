import { ArrowUpRight } from "lucide-react"

import { Card, CardContent } from "@formfit/ui/card"
import { kpiCards } from "@formfit/shared/mock-data"

export function KpiCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpiCards.map((card) => {
        const Icon = card.icon

        return (
          <Card key={card.id} className="shadow-none">
            <CardContent className="flex items-start justify-between gap-3">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="text-3xl font-semibold tracking-tight">
                  {card.value}
                </p>
                <p className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                  <ArrowUpRight className="size-3.5" />
                  {card.trend}
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
