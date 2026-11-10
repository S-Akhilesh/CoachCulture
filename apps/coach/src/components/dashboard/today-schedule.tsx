import { Clock } from "lucide-react"

import { Avatar, AvatarFallback } from "@formfit/ui/avatar"
import { Badge } from "@formfit/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@formfit/ui/card"
import { todaysSchedule } from "@formfit/shared/mock-data"

export function TodaySchedule() {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>Today&apos;s schedule</CardTitle>
        <CardDescription>
          {todaysSchedule.length} sessions lined up
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {todaysSchedule.map((session) => (
          <div
            key={session.id}
            className="flex items-start gap-3 rounded-lg border border-border/80 p-3"
          >
            <Avatar size="sm">
              <AvatarFallback className="bg-muted text-foreground">
                {session.clientInitials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="truncate text-sm font-medium">
                  {session.clientName}
                </p>
                <Badge variant="secondary" className="shrink-0">
                  {session.duration}
                </Badge>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {session.type}
              </p>
              <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="size-3.5" />
                {session.time}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
