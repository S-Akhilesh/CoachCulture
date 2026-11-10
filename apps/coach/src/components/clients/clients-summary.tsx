import { UserCheck, UserX, Users } from "lucide-react"

import { Card, CardContent } from "@formfit/ui/card"
import type { Client } from "@formfit/shared/clients-data"

export function ClientsSummary({ clients }: { clients: Client[] }) {
  const total = clients.length
  const active = clients.filter((client) => client.status === "active").length
  const inactive = total - active

  const cards = [
    {
      title: "Total Clients",
      value: total,
      icon: Users,
    },
    {
      title: "Active Clients",
      value: active,
      icon: UserCheck,
    },
    {
      title: "Inactive Clients",
      value: inactive,
      icon: UserX,
    },
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
