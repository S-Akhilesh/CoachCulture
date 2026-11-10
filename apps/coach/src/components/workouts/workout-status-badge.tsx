import { Badge } from "@formfit/ui/badge"
import type { WorkoutStatus } from "@formfit/shared/workouts-data"

export function WorkoutStatusBadge({ status }: { status: WorkoutStatus }) {
  if (status === "active") {
    return (
      <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
        Active
      </Badge>
    )
  }

  return (
    <Badge variant="secondary" className="text-muted-foreground">
      Draft
    </Badge>
  )
}
