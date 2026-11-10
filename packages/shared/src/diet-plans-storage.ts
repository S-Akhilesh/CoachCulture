import {
  type DietFoodItem,
  type DietGoal,
  type DietMeal,
  type DietPlan,
  type DietPlanStatus,
  dietGoals,
  initialDietPlans,
} from "@formfit/shared/diet-plans-data"

export const DIET_PLANS_STORAGE_KEY = "formfit:diet-plans:v1"

const dietGoalsSet = new Set<string>(dietGoals)
const dietStatuses = new Set<DietPlanStatus>(["draft", "active"])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isDietFoodItem(value: unknown): value is DietFoodItem {
  if (!isRecord(value)) return false
  return (
    typeof value.id === "string" &&
    typeof value.foodId === "string" &&
    typeof value.name === "string" &&
    typeof value.servingSize === "string" &&
    typeof value.quantity === "number" &&
    Number.isFinite(value.quantity) &&
    typeof value.baseCalories === "number" &&
    typeof value.baseProtein === "number" &&
    typeof value.baseCarbs === "number" &&
    typeof value.baseFat === "number" &&
    typeof value.notes === "string"
  )
}

function isDietMeal(value: unknown): value is DietMeal {
  if (!isRecord(value)) return false
  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.timing === "string" &&
    typeof value.notes === "string" &&
    Array.isArray(value.foods) &&
    value.foods.every(isDietFoodItem)
  )
}

function isDietPlan(value: unknown): value is DietPlan {
  if (!isRecord(value)) return false
  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    dietGoalsSet.has(value.goal as DietGoal) &&
    typeof value.description === "string" &&
    typeof value.calorieTarget === "number" &&
    typeof value.proteinTarget === "number" &&
    typeof value.carbsTarget === "number" &&
    typeof value.fatTarget === "number" &&
    dietStatuses.has(value.status as DietPlanStatus) &&
    Array.isArray(value.meals) &&
    value.meals.every(isDietMeal) &&
    Array.isArray(value.assignedClientIds) &&
    value.assignedClientIds.every((id) => typeof id === "string") &&
    typeof value.updatedAt === "string"
  )
}

export function isDietPlanArray(value: unknown): value is DietPlan[] {
  return Array.isArray(value) && value.every(isDietPlan)
}

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

/**
 * Load diet plans from localStorage.
 * Falls back to mock seed data when missing, empty, or corrupt.
 * Safe to call only on the client.
 */
export function loadDietPlans(): DietPlan[] {
  if (!canUseLocalStorage()) {
    return initialDietPlans
  }

  try {
    const raw = window.localStorage.getItem(DIET_PLANS_STORAGE_KEY)
    if (raw === null) {
      return initialDietPlans
    }

    const parsed: unknown = JSON.parse(raw)
    if (!isDietPlanArray(parsed)) {
      return initialDietPlans
    }

    return parsed
  } catch {
    return initialDietPlans
  }
}

/**
 * Persist diet plans to localStorage.
 * No-ops on the server or when storage is unavailable.
 */
export function saveDietPlans(plans: DietPlan[]): void {
  if (!canUseLocalStorage()) return

  try {
    window.localStorage.setItem(DIET_PLANS_STORAGE_KEY, JSON.stringify(plans))
  } catch {
    // Quota or privacy mode — keep in-memory state working.
  }
}
