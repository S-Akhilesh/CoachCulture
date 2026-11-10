import {
  type DailyMealLog,
  type MealFoodLog,
  type MealLogEntry,
  type ProgressEntry,
  type WorkoutExerciseLog,
  type WorkoutSession,
  type WorkoutSetLog,
} from "@formfit/shared/portal-data"

export const WORKOUT_SESSIONS_STORAGE_KEY = "formfit:workout-sessions:v1"
export const MEAL_LOGS_STORAGE_KEY = "formfit:meal-logs:v1"
export const PROGRESS_ENTRIES_STORAGE_KEY = "formfit:progress-entries:v1"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined"
}

function isWorkoutSetLog(value: unknown): value is WorkoutSetLog {
  if (!isRecord(value)) return false
  return (
    typeof value.setNumber === "number" &&
    Number.isFinite(value.setNumber) &&
    typeof value.prescribedReps === "string" &&
    (value.actualReps === null || typeof value.actualReps === "number") &&
    (value.actualWeight === null || typeof value.actualWeight === "number") &&
    typeof value.completed === "boolean"
  )
}

function isWorkoutExerciseLog(value: unknown): value is WorkoutExerciseLog {
  if (!isRecord(value)) return false
  return (
    typeof value.exerciseId === "string" &&
    typeof value.name === "string" &&
    typeof value.muscleGroup === "string" &&
    typeof value.prescribedSets === "number" &&
    typeof value.prescribedReps === "string" &&
    typeof value.restSeconds === "number" &&
    typeof value.coachNotes === "string" &&
    typeof value.completed === "boolean" &&
    Array.isArray(value.sets) &&
    value.sets.every(isWorkoutSetLog)
  )
}

function isWorkoutSession(value: unknown): value is WorkoutSession {
  if (!isRecord(value)) return false
  return (
    typeof value.id === "string" &&
    typeof value.clientId === "string" &&
    typeof value.planId === "string" &&
    typeof value.planName === "string" &&
    typeof value.dayId === "string" &&
    typeof value.dayName === "string" &&
    typeof value.dayFocus === "string" &&
    typeof value.startedAt === "string" &&
    (value.completedAt === null || typeof value.completedAt === "string") &&
    (value.status === "in_progress" || value.status === "completed") &&
    typeof value.notes === "string" &&
    Array.isArray(value.exercises) &&
    value.exercises.every(isWorkoutExerciseLog)
  )
}

function isMealFoodLog(value: unknown): value is MealFoodLog {
  if (!isRecord(value)) return false
  return (
    typeof value.foodItemId === "string" &&
    typeof value.name === "string" &&
    typeof value.servingSize === "string" &&
    typeof value.prescribedQuantity === "number" &&
    typeof value.actualQuantity === "number" &&
    typeof value.baseCalories === "number" &&
    typeof value.baseProtein === "number" &&
    typeof value.baseCarbs === "number" &&
    typeof value.baseFat === "number"
  )
}

function isMealLogEntry(value: unknown): value is MealLogEntry {
  if (!isRecord(value)) return false
  return (
    typeof value.mealId === "string" &&
    typeof value.mealName === "string" &&
    typeof value.timing === "string" &&
    typeof value.eaten === "boolean" &&
    Array.isArray(value.foods) &&
    value.foods.every(isMealFoodLog)
  )
}

function isDailyMealLog(value: unknown): value is DailyMealLog {
  if (!isRecord(value)) return false
  return (
    typeof value.id === "string" &&
    typeof value.clientId === "string" &&
    typeof value.planId === "string" &&
    typeof value.date === "string" &&
    typeof value.updatedAt === "string" &&
    Array.isArray(value.meals) &&
    value.meals.every(isMealLogEntry)
  )
}

function isProgressEntry(value: unknown): value is ProgressEntry {
  if (!isRecord(value)) return false
  return (
    typeof value.id === "string" &&
    typeof value.clientId === "string" &&
    typeof value.date === "string" &&
    typeof value.weight === "number" &&
    Number.isFinite(value.weight) &&
    (value.waist === null || typeof value.waist === "number") &&
    (value.chest === null || typeof value.chest === "number") &&
    (value.hips === null || typeof value.hips === "number") &&
    typeof value.notes === "string" &&
    typeof value.createdAt === "string"
  )
}

export function isWorkoutSessionArray(
  value: unknown
): value is WorkoutSession[] {
  return Array.isArray(value) && value.every(isWorkoutSession)
}

export function isDailyMealLogArray(value: unknown): value is DailyMealLog[] {
  return Array.isArray(value) && value.every(isDailyMealLog)
}

export function isProgressEntryArray(value: unknown): value is ProgressEntry[] {
  return Array.isArray(value) && value.every(isProgressEntry)
}

function loadArray<T>(
  key: string,
  guard: (value: unknown) => value is T[]
): T[] {
  if (!canUseLocalStorage()) return []

  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return []
    const parsed: unknown = JSON.parse(raw)
    if (!guard(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

function saveArray<T>(key: string, value: T[]): void {
  if (!canUseLocalStorage()) return

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Quota or privacy mode — keep in-memory state working.
  }
}

export function loadWorkoutSessions(): WorkoutSession[] {
  return loadArray(WORKOUT_SESSIONS_STORAGE_KEY, isWorkoutSessionArray)
}

export function saveWorkoutSessions(sessions: WorkoutSession[]): void {
  saveArray(WORKOUT_SESSIONS_STORAGE_KEY, sessions)
}

export function loadMealLogs(): DailyMealLog[] {
  return loadArray(MEAL_LOGS_STORAGE_KEY, isDailyMealLogArray)
}

export function saveMealLogs(logs: DailyMealLog[]): void {
  saveArray(MEAL_LOGS_STORAGE_KEY, logs)
}

export function loadProgressEntries(): ProgressEntry[] {
  return loadArray(PROGRESS_ENTRIES_STORAGE_KEY, isProgressEntryArray)
}

export function saveProgressEntries(entries: ProgressEntry[]): void {
  saveArray(PROGRESS_ENTRIES_STORAGE_KEY, entries)
}
