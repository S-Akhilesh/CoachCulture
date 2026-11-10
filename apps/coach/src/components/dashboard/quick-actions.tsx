import { Apple, Dumbbell, UserPlus } from "lucide-react"

import { Button } from "@formfit/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@formfit/ui/card"

const actions = [
  {
    label: "Add Client",
    description: "Invite a new athlete to your roster",
    icon: UserPlus,
  },
  {
    label: "Create Workout",
    description: "Build a training plan for a client",
    icon: Dumbbell,
  },
  {
    label: "Create Diet Plan",
    description: "Set macros and meal guidance",
    icon: Apple,
  },
] as const

export function QuickActions() {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>Quick actions</CardTitle>
        <CardDescription>Jump into everyday coaching tasks</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {actions.map((action) => {
          const Icon = action.icon

          return (
            <Button
              key={action.label}
              variant="outline"
              className="h-auto items-start justify-start gap-3 px-3 py-3 text-left whitespace-normal"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="size-4" />
              </span>
              <span className="space-y-0.5">
                <span className="block text-sm font-medium text-foreground">
                  {action.label}
                </span>
                <span className="block text-xs font-normal text-muted-foreground">
                  {action.description}
                </span>
              </span>
            </Button>
          )
        })}
      </CardContent>
    </Card>
  )
}
