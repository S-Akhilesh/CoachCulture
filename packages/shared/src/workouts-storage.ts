import {
  type WorkoutDay,
  type WorkoutExercise,
  type WorkoutGoal,
  type WorkoutPlan,
  type WorkoutStatus,
  initialWorkoutPlans,
  workoutGoals,
} from "@formfit/shared/workouts-data"

export const WORKOUTS_STORAGE_KEY = "formfit:workouts:v1"

const workoutGoalsSet = new Set<string>(workoutGoals)
const workoutStatuses = new Set<WorkoutStatus>(["draft", "active"])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isWorkoutExercise(value: unknown): value is WorkoutExercise {
  if (!isRecord(value)) return false
  return (
    typeof value.id === "string" &&
    typeof value.libraryExerciseId === "string" &&
    typeof value.name === "string" &&
    typeof value.muscleGroup === "string" &&
    typeof value.equipment === "string" &&
    typeof value.sets === "number" &&
    Number.isFinite(value.sets) &&
    typeof value.reps === "string" &&
    typeof value.restSeconds === "number" &&
    Number.isFinite(value.restSeconds) &&
    typeof value.notes === "string"
  )
}

function isWorkoutDay(value: unknown): value is WorkoutDay {
  if (!isRecord(value)) return false
  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.focus === "string" &&
    typeof value.isRestDay === "boolean" &&
    Array.isArray(value.exercises) &&
    value.exercises.every(isWorkoutExercise)
  )
}

function isWorkoutPlan(value: unknown): value is WorkoutPlan {
  if (!isRecord(value)) return false
  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    workoutGoalsSet.has(value.goal as WorkoutGoal) &&
    typeof value.description === "string" &&
    typeof value.daysPerWeek === "number" &&
    Number.isFinite(value.daysPerWeek) &&
    workoutStatuses.has(value.status as WorkoutStatus) &&
    Array.isArray(value.days) &&
    value.days.every(isWorkoutDay) &&
    Array.isArray(value.assignedClientIds) &&
    value.assignedClientIds.every((id) => typeof id === "string") &&
    typeof value.updatedAt === "string"
  )
}

export function isWorkoutPlanArray(value: unknown): value is WorkoutPlan[] {
  return Array.isArray(value) && value.every(isWorkoutPlan)
}

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

/**
 * Load workout plans from localStorage.
 * Falls back to mock seed data when missing or corrupt.
 * Safe to call only on the client.
 */
export function loadWorkoutPlans(): WorkoutPlan[] {
  if (!canUseLocalStorage()) {
    return initialWorkoutPlans
  }

  try {
    const raw = window.localStorage.getItem(WORKOUTS_STORAGE_KEY)
    if (raw === null) {
      return initialWorkoutPlans
    }

    const parsed: unknown = JSON.parse(raw)
    if (!isWorkoutPlanArray(parsed)) {
      return initialWorkoutPlans
    }

    return parsed
  } catch {
    return initialWorkoutPlans
  }
}

/**
 * Persist workout plans to localStorage.
 * No-ops on the server or when storage is unavailable.
 */
export function saveWorkoutPlans(plans: WorkoutPlan[]): void {
  if (!canUseLocalStorage()) return

  try {
    window.localStorage.setItem(WORKOUTS_STORAGE_KEY, JSON.stringify(plans))
  } catch {
    // Quota or privacy mode — keep in-memory state working.
  }
}
