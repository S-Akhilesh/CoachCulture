"use client"

import { useMemo } from "react"
import { Apple, Check } from "lucide-react"
import { cn } from "cn"

import { usePortal } from "@/components/portal-context"
import { Badge } from "@formfit/ui/badge"
import { Button } from "@formfit/ui/button"
import { Checkbox } from "@formfit/ui/checkbox"
import { Input } from "@formfit/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@formfit/ui/card"
import {
  getDailyMealLogNutrition,
  getFoodLogNutrition,
  getMealLogNutrition,
  getPrescribedMealNutrition,
} from "@formfit/shared/portal-data"
import { getPlanNutrition } from "@formfit/shared/diet-plans-data"

function MacroChip({
  label,
  value,
  unit = "g",
}: {
  label: string
  value: number
  unit?: string
}) {
  return (
    <div className="rounded-lg bg-muted/60 px-3 py-2 text-center">
      <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium tabular-nums">
        {value}
        {unit}
      </p>
    </div>
  )
}

function MacroBar({
  label,
  value,
  target,
  unit,
}: {
  label: string
  value: number
  target: number
  unit: string
}) {
  const percent =
    target <= 0 ? 0 : Math.min(100, Math.round((value / target) * 100))

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">
          {value}
          <span className="font-normal text-muted-foreground">
            {" "}
            / {target}
            {unit}
          </span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

export function AssignedDietView() {
  const {
    dietPlan,
    todayMealLog,
    ensureTodayMealLog,
    updateMealEntry,
  } = usePortal()

  const log = useMemo(() => {
    if (!dietPlan) return null
    return todayMealLog
  }, [dietPlan, todayMealLog])

  const consumed = getDailyMealLogNutrition(log)
  const prescribedTotals = dietPlan ? getPlanNutrition(dietPlan) : null

  if (!dietPlan) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Diet</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your assigned nutrition plan
          </p>
        </div>
        <Card className="shadow-none">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Apple className="size-5 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">No diet plan assigned</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Your coach hasn&apos;t assigned a diet plan yet. Meal logging
                will appear here once they do.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleEnsureLog = () => {
    ensureTodayMealLog()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">{dietPlan.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {dietPlan.goal}
          {dietPlan.description ? ` · ${dietPlan.description}` : null}
        </p>
      </div>

      <Card className="shadow-none">
        <CardHeader className="border-b">
          <CardTitle>Daily targets</CardTitle>
          <CardDescription>
            Prescribed plan totals vs your logged intake today
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-(--card-spacing)">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <MacroChip
              label="Calories"
              value={dietPlan.calorieTarget}
              unit=" kcal"
            />
            <MacroChip label="Protein" value={dietPlan.proteinTarget} />
            <MacroChip label="Carbs" value={dietPlan.carbsTarget} />
            <MacroChip label="Fat" value={dietPlan.fatTarget} />
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-sm font-medium">Logged today</p>
            <MacroBar
              label="Calories"
              value={consumed.calories}
              target={dietPlan.calorieTarget}
              unit=" kcal"
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <MacroBar
                label="Protein"
                value={consumed.protein}
                target={dietPlan.proteinTarget}
                unit="g"
              />
              <MacroBar
                label="Carbs"
                value={consumed.carbs}
                target={dietPlan.carbsTarget}
                unit="g"
              />
              <MacroBar
                label="Fat"
                value={consumed.fat}
                target={dietPlan.fatTarget}
                unit="g"
              />
            </div>
          </div>

          {prescribedTotals ? (
            <p className="text-xs text-muted-foreground">
              Plan foods total ~{prescribedTotals.calories} kcal when eaten as
              prescribed.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div id="log" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium">Meals</h2>
          {!log ? (
            <Button size="sm" onClick={handleEnsureLog}>
              Start logging today
            </Button>
          ) : null}
        </div>

        {dietPlan.meals.map((meal, index) => {
          const mealLog = log?.meals.find((item) => item.mealId === meal.id)
          const prescribed = getPrescribedMealNutrition(meal)
          const actual = mealLog
            ? getMealLogNutrition(mealLog)
            : { calories: 0, protein: 0, carbs: 0, fat: 0 }
          const eaten = mealLog?.eaten ?? false

          return (
            <Card
              key={meal.id}
              className={cn("shadow-none", eaten && "border-primary/40")}
            >
              <CardHeader className="border-b">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {index + 1}.
                      </span>
                      {meal.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {meal.timing || "Anytime"}
                      {" · "}
                      Prescribed {prescribed.calories} kcal
                    </CardDescription>
                  </div>
                  {eaten ? (
                    <Badge className="gap-1">
                      <Check className="size-3" />
                      Eaten
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Pending</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-(--card-spacing)">
                {meal.notes ? (
                  <p className="text-xs text-muted-foreground">
                    Coach: {meal.notes}
                  </p>
                ) : null}

                <div className="space-y-3">
                  {meal.foods.map((food) => {
                    const foodLog = mealLog?.foods.find(
                      (item) => item.foodItemId === food.id
                    )
                    const quantity =
                      foodLog?.actualQuantity ?? food.quantity
                    const nutrition = foodLog
                      ? getFoodLogNutrition(foodLog)
                      : getPrescribedMealNutrition({
                          ...meal,
                          foods: [food],
                        })

                    return (
                      <div
                        key={food.id}
                        className="rounded-lg border border-border p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{food.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Serving {food.servingSize}
                              {" · "}
                              Prescribed ×{food.quantity}
                            </p>
                          </div>
                          <p className="shrink-0 text-sm tabular-nums text-muted-foreground">
                            {nutrition.calories} kcal
                          </p>
                        </div>
                        {log ? (
                          <div className="mt-3 flex items-center gap-2">
                            <label className="text-xs text-muted-foreground">
                              Actual qty
                            </label>
                            <Input
                              type="number"
                              inputMode="decimal"
                              min={0}
                              step={0.25}
                              className="h-9 w-24 text-base tabular-nums"
                              value={quantity}
                              disabled={!eaten}
                              onChange={(event) => {
                                const next = Number(event.target.value)
                                updateMealEntry(meal.id, (entry) => ({
                                  ...entry,
                                  foods: entry.foods.map((item) =>
                                    item.foodItemId === food.id
                                      ? {
                                          ...item,
                                          actualQuantity: Number.isFinite(next)
                                            ? next
                                            : item.actualQuantity,
                                        }
                                      : item
                                  ),
                                }))
                              }}
                            />
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                  <p className="text-sm text-muted-foreground">
                    {eaten
                      ? `Logged ${actual.calories} kcal · P ${actual.protein}g · C ${actual.carbs}g · F ${actual.fat}g`
                      : "Mark as eaten to log quantities"}
                  </p>
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                    <Checkbox
                      checked={eaten}
                      onCheckedChange={(value) => {
                        updateMealEntry(meal.id, (entry) => ({
                          ...entry,
                          eaten: value === true,
                        }))
                      }}
                    />
                    Mark eaten
                  </label>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
