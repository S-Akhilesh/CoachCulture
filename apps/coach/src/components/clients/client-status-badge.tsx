import { Badge } from "@formfit/ui/badge"
import type { ClientStatus } from "@formfit/shared/clients-data"

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  if (status === "active") {
    return (
      <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
        Active
      </Badge>
    )
  }

  return (
    <Badge variant="secondary" className="text-muted-foreground">
      Inactive
    </Badge>
  )
}
