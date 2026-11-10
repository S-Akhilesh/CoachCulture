"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Pencil, UserPlus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { AssignClientsDialog } from "@/components/diet-plans/assign-clients-dialog"
import { DietStatusBadge } from "@/components/diet-plans/diet-status-badge"
import { NutritionSummary } from "@/components/diet-plans/nutrition-summary"
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
import { initialClients } from "@formfit/shared/clients-data"
import {
  type DietPlan,
  countMeals,
  getFoodItemNutrition,
  getMealNutrition,
  getPlanNutrition,
} from "@formfit/shared/diet-plans-data"

export function DietPlanDetailView({ plan }: { plan: DietPlan }) {
  const router = useRouter()
  const { assignClients, getPlan } = useDietPlans()
  const [assignOpen, setAssignOpen] = useState(false)
  const currentPlan = getPlan(plan.id) ?? plan
  const dailyNutrition = getPlanNutrition(currentPlan)

  const assignedClients = initialClients.filter((client) =>
    currentPlan.assignedClientIds.includes(client.id)
  )

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/diet-plans" />}
            className="w-fit"
          >
            <ArrowLeft className="size-4" />
            Back to diet plans
          </Button>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-semibold tracking-tight">
                {currentPlan.name}
              </h2>
              <DietStatusBadge status={currentPlan.status} />
            </div>
            <p className="text-sm text-muted-foreground">{currentPlan.goal}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setAssignOpen(true)}>
            <UserPlus className="size-4" />
            Assign to Clients
          </Button>
          <Button
            onClick={() => router.push(`/diet-plans/${currentPlan.id}/edit`)}
          >
            <Pencil className="size-4" />
            Edit
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-none">
          <CardContent className="pt-1">
            <p className="text-sm text-muted-foreground">Meals</p>
            <p className="mt-2 text-2xl font-semibold">
              {countMeals(currentPlan)}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardContent className="pt-1">
            <p className="text-sm text-muted-foreground">Calorie target</p>
            <p className="mt-2 text-2xl font-semibold">
              {currentPlan.calorieTarget.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardContent className="pt-1">
            <p className="text-sm text-muted-foreground">Assigned clients</p>
            <p className="mt-2 text-2xl font-semibold">
              {currentPlan.assignedClientIds.length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>{currentPlan.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              P {currentPlan.proteinTarget}g
            </Badge>
            <Badge variant="secondary">C {currentPlan.carbsTarget}g</Badge>
            <Badge variant="secondary">F {currentPlan.fatTarget}g</Badge>
          </div>
          {assignedClients.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {assignedClients.map((client) => (
                <Badge key={client.id} variant="secondary">
                  {client.fullName}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Not assigned to any clients yet.
            </p>
          )}
        </CardContent>
      </Card>

      <NutritionSummary
        actual={dailyNutrition}
        target={{
          calories: currentPlan.calorieTarget,
          protein: currentPlan.proteinTarget,
          carbs: currentPlan.carbsTarget,
          fat: currentPlan.fatTarget,
        }}
        title="Daily nutrition vs targets"
      />

      <div className="space-y-4">
        {currentPlan.meals.map((meal) => {
          const mealNutrition = getMealNutrition(meal)

          return (
            <Card key={meal.id} className="shadow-none">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">
                      {meal.name}
                      {meal.timing ? ` · ${meal.timing}` : ""}
                    </CardTitle>
                    <CardDescription>
                      {meal.foods.length} food
                      {meal.foods.length === 1 ? "" : "s"} ·{" "}
                      {mealNutrition.calories} kcal
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {meal.foods.map((food) => {
                  const nutrition = getFoodItemNutrition(food)
                  return (
                    <div
                      key={food.id}
                      className="rounded-lg border border-border px-3 py-2"
                    >
                      <p className="text-sm font-medium">{food.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {food.quantity} × {food.servingSize} ·{" "}
                        {nutrition.calories} kcal · P {nutrition.protein}g · C{" "}
                        {nutrition.carbs}g · F {nutrition.fat}g
                      </p>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <AssignClientsDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        plan={currentPlan}
        onConfirm={(clientIds) => {
          assignClients(currentPlan.id, clientIds)
          toast.success(
            clientIds.length > 0
              ? `Assigned to ${clientIds.length} client${clientIds.length === 1 ? "" : "s"}`
              : "Cleared client assignments"
          )
        }}
      />
    </div>
  )
}
