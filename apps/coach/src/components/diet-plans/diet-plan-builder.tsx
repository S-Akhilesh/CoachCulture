"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Plus,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { AssignClientsDialog } from "@/components/diet-plans/assign-clients-dialog"
import { FoodEditDialog } from "@/components/diet-plans/food-edit-dialog"
import { FoodLibrarySheet } from "@/components/diet-plans/food-library-sheet"
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
import { Input } from "@formfit/ui/input"
import { Label } from "@formfit/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@formfit/ui/select"
import { Textarea } from "@formfit/ui/textarea"
import {
  type DietFoodItem,
  type DietMeal,
  type DietPlan,
  type DietPlanDraft,
  countMeals,
  createEmptyDietDraft,
  createEmptyMeal,
  createFoodFromLibrary,
  dietGoals,
  getFoodItemNutrition,
  getMealNutrition,
  getPlanNutrition,
} from "@formfit/shared/diet-plans-data"

type BuilderStep = 1 | 2 | 3

type DietPlanBuilderProps = {
  initialPlan?: DietPlan
}

function moveItem<T>(items: T[], from: number, to: number) {
  if (to < 0 || to >= items.length) return items
  const next = [...items]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export function DietPlanBuilder({ initialPlan }: DietPlanBuilderProps) {
  const router = useRouter()
  const { savePlan, assignClients } = useDietPlans()
  const [step, setStep] = useState<BuilderStep>(1)
  const [draft, setDraft] = useState<DietPlanDraft>(() =>
    initialPlan
      ? {
          id: initialPlan.id,
          name: initialPlan.name,
          goal: initialPlan.goal,
          description: initialPlan.description,
          calorieTarget: initialPlan.calorieTarget,
          proteinTarget: initialPlan.proteinTarget,
          carbsTarget: initialPlan.carbsTarget,
          fatTarget: initialPlan.fatTarget,
          status: initialPlan.status,
          meals: initialPlan.meals,
          assignedClientIds: initialPlan.assignedClientIds,
        }
      : createEmptyDietDraft()
  )
  const [activeMealId, setActiveMealId] = useState(
    () => draft.meals[0]?.id ?? ""
  )
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [editingFood, setEditingFood] = useState<DietFoodItem | null>(null)
  const [assignOpen, setAssignOpen] = useState(false)
  const [savedPlan, setSavedPlan] = useState<DietPlan | null>(
    initialPlan ?? null
  )
  const [errors, setErrors] = useState<{ name?: string; meals?: string }>({})

  const activeMeal = useMemo(
    () =>
      draft.meals.find((meal) => meal.id === activeMealId) ?? draft.meals[0],
    [activeMealId, draft.meals]
  )

  const dailyNutrition = useMemo(() => getPlanNutrition(draft), [draft])
  const targets = useMemo(
    () => ({
      calories: draft.calorieTarget,
      protein: draft.proteinTarget,
      carbs: draft.carbsTarget,
      fat: draft.fatTarget,
    }),
    [
      draft.calorieTarget,
      draft.carbsTarget,
      draft.fatTarget,
      draft.proteinTarget,
    ]
  )

  function updateMeal(mealId: string, updater: (meal: DietMeal) => DietMeal) {
    setDraft((current) => ({
      ...current,
      meals: current.meals.map((meal) =>
        meal.id === mealId ? updater(meal) : meal
      ),
    }))
  }

  function validateDetails() {
    const nextErrors: { name?: string; meals?: string } = {}
    if (!draft.name.trim()) nextErrors.name = "Plan name is required"
    if (draft.meals.length === 0) nextErrors.meals = "Add at least one meal"
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function goToStep(nextStep: BuilderStep) {
    if (nextStep > 1 && !validateDetails()) {
      setStep(1)
      return
    }
    setStep(nextStep)
  }

  function handleSave(status: "draft" | "active") {
    if (!validateDetails()) {
      setStep(1)
      toast.error("Add a plan name before saving")
      return
    }

    const saved = savePlan(
      {
        ...draft,
        name: draft.name.trim(),
        description: draft.description.trim(),
      },
      status
    )

    setSavedPlan(saved)
    setDraft((current) => ({ ...current, id: saved.id, status: saved.status }))
    toast.success(
      status === "active"
        ? `Published “${saved.name}”`
        : `Saved “${saved.name}” as draft`
    )
    router.push("/diet-plans")
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="outline"
          size="sm"
          render={<Link href="/diet-plans" />}
          className="w-fit"
        >
          <ArrowLeft className="size-4" />
          Back to diet plans
        </Button>

        <div className="flex flex-wrap gap-2">
          {[
            { id: 1 as const, label: "1. Details" },
            { id: 2 as const, label: "2. Meals & foods" },
            { id: 3 as const, label: "3. Review" },
          ].map((item) => (
            <Button
              key={item.id}
              size="sm"
              variant={step === item.id ? "default" : "outline"}
              onClick={() => goToStep(item.id)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      {step === 1 ? (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Plan details</CardTitle>
            <CardDescription>
              Set the nutrition targets before building meals.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="plan-name">Diet plan name</Label>
              <Input
                id="plan-name"
                value={draft.name}
                onChange={(event) => {
                  setDraft((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                  setErrors((current) => ({ ...current, name: undefined }))
                }}
                placeholder="Muscle Gain — 2,400 kcal"
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name ? (
                <p className="text-xs text-destructive">{errors.name}</p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Goal</Label>
                <Select
                  value={draft.goal}
                  onValueChange={(value) => {
                    if (!value) return
                    setDraft((current) => ({
                      ...current,
                      goal: value as DietPlanDraft["goal"],
                    }))
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dietGoals.map((goal) => (
                      <SelectItem key={goal} value={goal}>
                        {goal}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="calories">Daily calorie target</Label>
                <Input
                  id="calories"
                  type="number"
                  min={800}
                  value={draft.calorieTarget}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      calorieTarget: Math.max(
                        0,
                        Number(event.target.value) || 0
                      ),
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="protein">Protein target (g)</Label>
                <Input
                  id="protein"
                  type="number"
                  min={0}
                  value={draft.proteinTarget}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      proteinTarget: Math.max(
                        0,
                        Number(event.target.value) || 0
                      ),
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="carbs">Carbohydrate target (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  min={0}
                  value={draft.carbsTarget}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      carbsTarget: Math.max(
                        0,
                        Number(event.target.value) || 0
                      ),
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fat">Fat target (g)</Label>
                <Input
                  id="fat"
                  type="number"
                  min={0}
                  value={draft.fatTarget}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      fatTarget: Math.max(0, Number(event.target.value) || 0),
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={draft.description}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Who this plan is for, timing preferences, coaching notes..."
                className="min-h-28"
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={() => goToStep(2)}>Continue to meals</Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === 2 ? (
        <div className="space-y-6">
          <NutritionSummary
            actual={dailyNutrition}
            target={targets}
            title="Daily nutrition vs targets"
          />

          <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
            <Card className="h-fit shadow-none">
              <CardHeader className="gap-3">
                <div>
                  <CardTitle className="text-base">Meals</CardTitle>
                  <CardDescription>
                    Reorder meals and switch between them.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const meal = createEmptyMeal(draft.meals.length + 1)
                    setDraft((current) => ({
                      ...current,
                      meals: [...current.meals, meal],
                    }))
                    setActiveMealId(meal.id)
                  }}
                >
                  <Plus className="size-4" />
                  Add meal
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {draft.meals.map((meal, index) => {
                  const mealNutrition = getMealNutrition(meal)

                  return (
                    <div
                      key={meal.id}
                      className={`rounded-lg border p-2 ${
                        activeMeal?.id === meal.id
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      }`}
                    >
                      <button
                        type="button"
                        className="w-full text-left"
                        onClick={() => setActiveMealId(meal.id)}
                      >
                        <p className="text-sm font-medium">{meal.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {meal.timing || "No time set"} ·{" "}
                          {mealNutrition.calories} kcal
                        </p>
                      </button>
                      <div className="mt-2 flex gap-1">
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          onClick={() =>
                            setDraft((current) => ({
                              ...current,
                              meals: moveItem(current.meals, index, index - 1),
                            }))
                          }
                          aria-label="Move meal up"
                        >
                          <ArrowUp className="size-3.5" />
                        </Button>
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          onClick={() =>
                            setDraft((current) => ({
                              ...current,
                              meals: moveItem(current.meals, index, index + 1),
                            }))
                          }
                          aria-label="Move meal down"
                        >
                          <ArrowDown className="size-3.5" />
                        </Button>
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          className="ml-auto text-destructive"
                          onClick={() => {
                            setDraft((current) => {
                              const meals = current.meals.filter(
                                (item) => item.id !== meal.id
                              )
                              if (activeMealId === meal.id) {
                                setActiveMealId(meals[0]?.id ?? "")
                              }
                              return { ...current, meals }
                            })
                          }}
                          aria-label="Remove meal"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
                {errors.meals ? (
                  <p className="text-xs text-destructive">{errors.meals}</p>
                ) : null}
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="text-base">
                  {activeMeal ? activeMeal.name : "Select a meal"}
                </CardTitle>
                <CardDescription>
                  Configure timing and manage food items.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {activeMeal ? (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Label>Meal name</Label>
                        <Input
                          value={activeMeal.name}
                          onChange={(event) =>
                            updateMeal(activeMeal.id, (meal) => ({
                              ...meal,
                              name: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Meal timing</Label>
                        <Input
                          value={activeMeal.timing}
                          onChange={(event) =>
                            updateMeal(activeMeal.id, (meal) => ({
                              ...meal,
                              timing: event.target.value,
                            }))
                          }
                          placeholder="8:00 AM"
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label>Meal notes</Label>
                      <Textarea
                        value={activeMeal.notes}
                        onChange={(event) =>
                          updateMeal(activeMeal.id, (meal) => ({
                            ...meal,
                            notes: event.target.value,
                          }))
                        }
                        placeholder="Prep tips, substitutions, timing notes..."
                        className="min-h-20"
                      />
                    </div>

                    <NutritionSummary
                      actual={getMealNutrition(activeMeal)}
                      title={`${activeMeal.name} totals`}
                      compact
                    />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium">
                          Foods ({activeMeal.foods.length})
                        </p>
                        <Button size="sm" onClick={() => setLibraryOpen(true)}>
                          <Plus className="size-4" />
                          Add food item
                        </Button>
                      </div>

                      {activeMeal.foods.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                          No foods yet. Add items from the food library.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {activeMeal.foods.map((food, index) => {
                            const nutrition = getFoodItemNutrition(food)

                            return (
                              <div
                                key={food.id}
                                className="rounded-lg border border-border p-3"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium">
                                      {food.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {food.quantity} × {food.servingSize}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      {nutrition.calories} kcal · P{" "}
                                      {nutrition.protein}g · C {nutrition.carbs}
                                      g · F {nutrition.fat}g
                                    </p>
                                    {food.notes ? (
                                      <p className="mt-1 text-xs text-muted-foreground">
                                        Note: {food.notes}
                                      </p>
                                    ) : null}
                                  </div>
                                  <div className="flex shrink-0 gap-1">
                                    <Button
                                      size="icon-xs"
                                      variant="ghost"
                                      onClick={() =>
                                        updateMeal(activeMeal.id, (meal) => ({
                                          ...meal,
                                          foods: moveItem(
                                            meal.foods,
                                            index,
                                            index - 1
                                          ),
                                        }))
                                      }
                                      aria-label="Move food up"
                                    >
                                      <ArrowUp className="size-3.5" />
                                    </Button>
                                    <Button
                                      size="icon-xs"
                                      variant="ghost"
                                      onClick={() =>
                                        updateMeal(activeMeal.id, (meal) => ({
                                          ...meal,
                                          foods: moveItem(
                                            meal.foods,
                                            index,
                                            index + 1
                                          ),
                                        }))
                                      }
                                      aria-label="Move food down"
                                    >
                                      <ArrowDown className="size-3.5" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setEditingFood(food)}
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      size="icon-xs"
                                      variant="ghost"
                                      className="text-destructive"
                                      onClick={() =>
                                        updateMeal(activeMeal.id, (meal) => ({
                                          ...meal,
                                          foods: meal.foods.filter(
                                            (item) => item.id !== food.id
                                          ),
                                        }))
                                      }
                                      aria-label="Remove food"
                                    >
                                      <Trash2 className="size-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap justify-between gap-2">
                      <Button variant="outline" onClick={() => goToStep(1)}>
                        Back
                      </Button>
                      <Button onClick={() => goToStep(3)}>
                        Continue to review
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Add a meal to get started.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Review & save</CardTitle>
            <CardDescription>
              Confirm meals, nutrition totals, and targets before publishing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-lg border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">
                    {draft.name || "Untitled plan"}
                  </h3>
                  <p className="text-sm text-muted-foreground">{draft.goal}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {countMeals(draft)} meals
                  </Badge>
                  <Badge variant="secondary">
                    {draft.assignedClientIds.length} assigned
                  </Badge>
                </div>
              </div>
              {draft.description ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  {draft.description}
                </p>
              ) : null}
            </div>

            <NutritionSummary
              actual={dailyNutrition}
              target={targets}
              title="Daily totals vs targets"
            />

            <div className="space-y-3">
              {draft.meals.map((meal) => {
                const mealNutrition = getMealNutrition(meal)

                return (
                  <div
                    key={meal.id}
                    className="rounded-lg border border-border p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium">
                        {meal.name}
                        {meal.timing ? ` · ${meal.timing}` : ""}
                      </p>
                      <Badge variant="secondary">
                        {mealNutrition.calories} kcal
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      P {mealNutrition.protein}g · C {mealNutrition.carbs}g · F{" "}
                      {mealNutrition.fat}g
                    </p>
                    {meal.foods.length > 0 ? (
                      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                        {meal.foods.map((food) => {
                          const nutrition = getFoodItemNutrition(food)
                          return (
                            <li key={food.id}>
                              {food.name} · {food.quantity} serving
                              {food.quantity === 1 ? "" : "s"} ·{" "}
                              {nutrition.calories} kcal
                            </li>
                          )
                        })}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">
                        No foods added
                      </p>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="outline" onClick={() => goToStep(2)}>
                Back to builder
              </Button>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!savedPlan && !draft.id) {
                      const saved = savePlan(
                        {
                          ...draft,
                          name: draft.name.trim() || "Untitled plan",
                        },
                        "draft"
                      )
                      setSavedPlan(saved)
                      setDraft((current) => ({ ...current, id: saved.id }))
                    }
                    setAssignOpen(true)
                  }}
                >
                  Assign to Clients
                </Button>
                <Button variant="outline" onClick={() => handleSave("draft")}>
                  Save as Draft
                </Button>
                <Button onClick={() => handleSave("active")}>
                  Publish Diet Plan
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <FoodLibrarySheet
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        onSelect={(food, quantity) => {
          if (!activeMeal) return
          updateMeal(activeMeal.id, (meal) => ({
            ...meal,
            foods: [...meal.foods, createFoodFromLibrary(food, quantity)],
          }))
          toast.success(`Added ${food.name}`)
        }}
      />

      <FoodEditDialog
        open={Boolean(editingFood)}
        onOpenChange={(open) => {
          if (!open) setEditingFood(null)
        }}
        food={editingFood}
        onSave={(food) => {
          if (!activeMeal) return
          updateMeal(activeMeal.id, (meal) => ({
            ...meal,
            foods: meal.foods.map((item) =>
              item.id === food.id ? food : item
            ),
          }))
          toast.success(`Updated ${food.name}`)
        }}
      />

      <AssignClientsDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        plan={
          savedPlan ??
          (draft.id
            ? {
                name: draft.name || "Untitled plan",
                assignedClientIds: draft.assignedClientIds,
              }
            : {
                name: draft.name || "Untitled plan",
                assignedClientIds: draft.assignedClientIds,
              })
        }
        onConfirm={(clientIds) => {
          const planId = savedPlan?.id ?? draft.id
          if (!planId) {
            const saved = savePlan(
              {
                ...draft,
                name: draft.name.trim() || "Untitled plan",
                assignedClientIds: clientIds,
              },
              draft.status
            )
            setSavedPlan(saved)
            setDraft((current) => ({
              ...current,
              id: saved.id,
              assignedClientIds: clientIds,
            }))
          } else {
            assignClients(planId, clientIds)
            setDraft((current) => ({
              ...current,
              assignedClientIds: clientIds,
            }))
            setSavedPlan((current) =>
              current
                ? { ...current, assignedClientIds: clientIds }
                : current
            )
          }
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
