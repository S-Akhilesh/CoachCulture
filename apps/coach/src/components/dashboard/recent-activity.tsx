import { cn } from "cn"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@formfit/ui/card"
import { recentActivity } from "@formfit/shared/mock-data"

const toneStyles = {
  green: "bg-emerald-50 text-emerald-700",
  blue: "bg-sky-50 text-sky-700",
  amber: "bg-amber-50 text-amber-700",
  slate: "bg-slate-100 text-slate-700",
} as const

export function RecentActivity() {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
        <CardDescription>Latest updates from your clients</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentActivity.map((item) => {
          const Icon = item.icon

          return (
            <div key={item.id} className="flex items-start gap-3">
              <div
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg",
                  toneStyles[item.tone]
                )}
              >
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{item.clientName}</p>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.timeAgo}
                </p>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
