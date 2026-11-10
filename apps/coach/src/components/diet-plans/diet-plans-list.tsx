"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Copy,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  UserPlus,
  UtensilsCrossed,
} from "lucide-react"
import { toast } from "sonner"

import { AssignClientsDialog } from "@/components/diet-plans/assign-clients-dialog"
import { DietStatusBadge } from "@/components/diet-plans/diet-status-badge"
import { useDietPlans } from "@/components/diet-plans/diet-plans-context"
import { Badge } from "@formfit/ui/badge"
import { Button } from "@formfit/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@formfit/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@formfit/ui/dropdown-menu"
import { Input } from "@formfit/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@formfit/ui/select"
import { initialClients } from "@formfit/shared/clients-data"
import {
  type DietPlan,
  type DietPlanStatus,
  countMeals,
} from "@formfit/shared/diet-plans-data"

type StatusFilter = "all" | DietPlanStatus

export function DietPlansList() {
  const router = useRouter()
  const { plans, duplicatePlan, deletePlan, assignClients } = useDietPlans()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [assignPlan, setAssignPlan] = useState<DietPlan | null>(null)

  const filteredPlans = useMemo(() => {
    const query = search.trim().toLowerCase()

    return plans.filter((plan) => {
      const matchesStatus =
        statusFilter === "all" ? true : plan.status === statusFilter
      const matchesSearch =
        query.length === 0 ||
        plan.name.toLowerCase().includes(query) ||
        plan.goal.toLowerCase().includes(query)

      return matchesStatus && matchesSearch
    })
  }, [plans, search, statusFilter])

  return (
    <>
      <Card className="shadow-none">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle>Diet plans</CardTitle>
              <CardDescription>
                Search, filter, and manage nutrition programs
              </CardDescription>
            </div>
            <p className="text-sm text-muted-foreground">
              {filteredPlans.length}{" "}
              {filteredPlans.length === 1 ? "result" : "results"}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by plan name or goal..."
                className="h-9 bg-muted/40 pl-8"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                if (
                  value === "all" ||
                  value === "active" ||
                  value === "draft"
                ) {
                  setStatusFilter(value)
                }
              }}
            >
              <SelectTrigger className="h-9 w-full bg-muted/40 sm:w-40">
                <SelectValue>
                  {statusFilter === "all"
                    ? "All statuses"
                    : statusFilter === "active"
                      ? "Active"
                      : "Draft"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {filteredPlans.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border px-6 py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <UtensilsCrossed className="size-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">No diet plans found</p>
                <p className="text-sm text-muted-foreground">
                  Try a different search term or status filter.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {filteredPlans.map((plan) => {
                const assignedNames = initialClients
                  .filter((client) =>
                    plan.assignedClientIds.includes(client.id)
                  )
                  .map((client) => client.fullName)

                return (
                  <div
                    key={plan.id}
                    className="flex flex-col gap-4 rounded-xl border border-border p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-semibold">
                            {plan.name}
                          </h3>
                          <DietStatusBadge status={plan.status} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {plan.goal}
                        </p>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                          aria-label={`Actions for ${plan.name}`}
                        >
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/diet-plans/${plan.id}`)
                            }
                          >
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/diet-plans/${plan.id}/edit`)
                            }
                          >
                            <Pencil className="size-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              const copy = duplicatePlan(plan.id)
                              if (copy) {
                                toast.success(`Duplicated as “${copy.name}”`)
                              }
                            }}
                          >
                            <Copy className="size-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setAssignPlan(plan)}
                          >
                            <UserPlus className="size-4" />
                            Assign
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => {
                              deletePlan(plan.id)
                              toast.success(`Deleted “${plan.name}”`)
                            }}
                          >
                            <Trash2 className="size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {plan.description}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">
                        {plan.calorieTarget.toLocaleString()} kcal
                      </Badge>
                      <Badge variant="secondary">
                        P {plan.proteinTarget}g
                      </Badge>
                      <Badge variant="secondary">C {plan.carbsTarget}g</Badge>
                      <Badge variant="secondary">F {plan.fatTarget}g</Badge>
                      <Badge variant="secondary">
                        {countMeals(plan)} meals
                      </Badge>
                      <Badge variant="secondary">
                        {plan.assignedClientIds.length} assigned
                      </Badge>
                    </div>

                    {assignedNames.length > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Assigned to {assignedNames.join(", ")}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Not assigned to any clients yet
                      </p>
                    )}

                    <div className="mt-auto flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        render={<Link href={`/diet-plans/${plan.id}`} />}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        render={<Link href={`/diet-plans/${plan.id}/edit`} />}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAssignPlan(plan)}
                      >
                        Assign
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AssignClientsDialog
        open={Boolean(assignPlan)}
        onOpenChange={(open) => {
          if (!open) setAssignPlan(null)
        }}
        plan={assignPlan}
        onConfirm={(clientIds) => {
          if (!assignPlan) return
          assignClients(assignPlan.id, clientIds)
          toast.success(
            clientIds.length > 0
              ? `Assigned “${assignPlan.name}” to ${clientIds.length} client${clientIds.length === 1 ? "" : "s"}`
              : `Cleared assignments for “${assignPlan.name}”`
          )
        }}
      />
    </>
  )
}
