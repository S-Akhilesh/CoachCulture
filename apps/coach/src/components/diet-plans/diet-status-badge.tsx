import { Badge } from "@formfit/ui/badge"
import type { DietPlanStatus } from "@formfit/shared/diet-plans-data"

export function DietStatusBadge({ status }: { status: DietPlanStatus }) {
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
