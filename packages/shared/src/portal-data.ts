import {
  type DietFoodItem,
  type DietMeal,
  type DietPlan,
  type NutritionMacros,
  getFoodItemNutrition,
  scaleNutrition,
  sumNutrition,
} from "@formfit/shared/diet-plans-data"
import {
  type WorkoutDay,
  type WorkoutExercise,
  type WorkoutPlan,
} from "@formfit/shared/workouts-data"

export type WorkoutSetLog = {
  setNumber: number
  prescribedReps: string
  actualReps: number | null
  actualWeight: number | null
  completed: boolean
}

export type WorkoutExerciseLog = {
  exerciseId: string
  name: string
  muscleGroup: string
  prescribedSets: number
  prescribedReps: string
  restSeconds: number
  coachNotes: string
  completed: boolean
  sets: WorkoutSetLog[]
}

export type WorkoutSessionStatus = "in_progress" | "completed"

export type WorkoutSession = {
  id: string
  clientId: string
  planId: string
  planName: string
  dayId: string
  dayName: string
  dayFocus: string
  startedAt: string
  completedAt: string | null
  status: WorkoutSessionStatus
  notes: string
  exercises: WorkoutExerciseLog[]
}

export type MealFoodLog = {
  foodItemId: string
  name: string
  servingSize: string
  prescribedQuantity: number
  actualQuantity: number
  baseCalories: number
  baseProtein: number
  baseCarbs: number
  baseFat: number
}

export type MealLogEntry = {
  mealId: string
  mealName: string
  timing: string
  eaten: boolean
  foods: MealFoodLog[]
}

export type DailyMealLog = {
  id: string
  clientId: string
  planId: string
  date: string
  meals: MealLogEntry[]
  updatedAt: string
}

export type ProgressEntry = {
  id: string
  clientId: string
  date: string
  weight: number
  waist: number | null
  chest: number | null
  hips: number | null
  notes: string
  createdAt: string
}

export type ProgressFormValues = {
  date: string
  weight: string
  waist: string
  chest: string
  hips: string
  notes: string
}

/** Parse the first number from a reps string like "8-12" or "10/leg". */
export function parseTargetReps(reps: string): number {
  const match = reps.match(/(\d+(\.\d+)?)/)
  if (!match) return 10
  return Number(match[1])
}

export function todayDateString() {
  return new Date().toISOString().slice(0, 10)
}

export function formatSessionDate(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

export function formatSessionTime(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
}

export function getAssignedWorkoutPlan(
  plans: WorkoutPlan[],
  clientId: string
): WorkoutPlan | undefined {
  return plans.find(
    (plan) =>
      plan.status === "active" && plan.assignedClientIds.includes(clientId)
  )
}

export function getAssignedDietPlan(
  plans: DietPlan[],
  clientId: string
): DietPlan | undefined {
  return plans.find(
    (plan) =>
      plan.status === "active" && plan.assignedClientIds.includes(clientId)
  )
}

export function getTrainingDays(plan: WorkoutPlan): WorkoutDay[] {
  return plan.days.filter((day) => !day.isRestDay)
}

/**
 * Pick today's suggested training day.
 * Prefers an in-progress session, otherwise rotates by weekday.
 */
export function getSuggestedTrainingDay(
  plan: WorkoutPlan,
  sessions: WorkoutSession[]
): WorkoutDay | null {
  const trainingDays = getTrainingDays(plan)
  if (trainingDays.length === 0) return null

  const today = todayDateString()
  const inProgress = sessions.find(
    (session) =>
      session.clientId &&
      session.status === "in_progress" &&
      session.planId === plan.id &&
      session.startedAt.startsWith(today)
  )

  if (inProgress) {
    return plan.days.find((day) => day.id === inProgress.dayId) ?? null
  }

  const weekday = (new Date().getDay() + 6) % 7
  return trainingDays[weekday % trainingDays.length] ?? null
}

export function wasDayCompletedToday(
  sessions: WorkoutSession[],
  dayId: string,
  clientId: string
) {
  const today = todayDateString()
  return sessions.some(
    (session) =>
      session.clientId === clientId &&
      session.dayId === dayId &&
      session.status === "completed" &&
      (session.completedAt?.startsWith(today) ||
        session.startedAt.startsWith(today))
  )
}

export function createExerciseLog(
  exercise: WorkoutExercise
): WorkoutExerciseLog {
  const defaultReps = parseTargetReps(exercise.reps)
  return {
    exerciseId: exercise.id,
    name: exercise.name,
    muscleGroup: exercise.muscleGroup,
    prescribedSets: exercise.sets,
    prescribedReps: exercise.reps,
    restSeconds: exercise.restSeconds,
    coachNotes: exercise.notes,
    completed: false,
    sets: Array.from({ length: Math.max(1, exercise.sets) }, (_, index) => ({
      setNumber: index + 1,
      prescribedReps: exercise.reps,
      actualReps: defaultReps,
      actualWeight: null,
      completed: false,
    })),
  }
}

export function createWorkoutSession(
  clientId: string,
  plan: WorkoutPlan,
  day: WorkoutDay
): WorkoutSession {
  return {
    id: `ws-${crypto.randomUUID()}`,
    clientId,
    planId: plan.id,
    planName: plan.name,
    dayId: day.id,
    dayName: day.name,
    dayFocus: day.focus,
    startedAt: new Date().toISOString(),
    completedAt: null,
    status: "in_progress",
    notes: "",
    exercises: day.exercises.map(createExerciseLog),
  }
}

export function getSessionProgress(session: WorkoutSession) {
  const totalSets = session.exercises.reduce(
    (sum, exercise) => sum + exercise.sets.length,
    0
  )
  const completedSets = session.exercises.reduce(
    (sum, exercise) =>
      sum + exercise.sets.filter((set) => set.completed).length,
    0
  )
  const completedExercises = session.exercises.filter(
    (exercise) => exercise.completed
  ).length

  return {
    totalSets,
    completedSets,
    totalExercises: session.exercises.length,
    completedExercises,
    percent:
      totalSets === 0 ? 0 : Math.round((completedSets / totalSets) * 100),
  }
}

export function createFoodLog(food: DietFoodItem): MealFoodLog {
  return {
    foodItemId: food.id,
    name: food.name,
    servingSize: food.servingSize,
    prescribedQuantity: food.quantity,
    actualQuantity: food.quantity,
    baseCalories: food.baseCalories,
    baseProtein: food.baseProtein,
    baseCarbs: food.baseCarbs,
    baseFat: food.baseFat,
  }
}

export function createMealLogEntry(meal: DietMeal): MealLogEntry {
  return {
    mealId: meal.id,
    mealName: meal.name,
    timing: meal.timing,
    eaten: false,
    foods: meal.foods.map(createFoodLog),
  }
}

export function createDailyMealLog(
  clientId: string,
  plan: DietPlan,
  date = todayDateString()
): DailyMealLog {
  return {
    id: `ml-${crypto.randomUUID()}`,
    clientId,
    planId: plan.id,
    date,
    meals: plan.meals.map(createMealLogEntry),
    updatedAt: new Date().toISOString(),
  }
}

export function getFoodLogNutrition(food: MealFoodLog): NutritionMacros {
  return scaleNutrition(
    {
      calories: food.baseCalories,
      protein: food.baseProtein,
      carbs: food.baseCarbs,
      fat: food.baseFat,
    },
    food.actualQuantity
  )
}

export function getMealLogNutrition(meal: MealLogEntry): NutritionMacros {
  if (!meal.eaten) {
    return { calories: 0, protein: 0, carbs: 0, fat: 0 }
  }
  return sumNutrition(meal.foods.map(getFoodLogNutrition))
}

export function getDailyMealLogNutrition(
  log: DailyMealLog | null | undefined
): NutritionMacros {
  if (!log) return { calories: 0, protein: 0, carbs: 0, fat: 0 }
  return sumNutrition(log.meals.map(getMealLogNutrition))
}

export function getPrescribedMealNutrition(meal: DietMeal): NutritionMacros {
  return sumNutrition(meal.foods.map(getFoodItemNutrition))
}

export function createEmptyProgressFormValues(
  defaults?: Partial<ProgressFormValues>
): ProgressFormValues {
  return {
    date: todayDateString(),
    weight: "",
    waist: "",
    chest: "",
    hips: "",
    notes: "",
    ...defaults,
  }
}

export function createProgressEntry(
  clientId: string,
  values: ProgressFormValues
): ProgressEntry {
  const parseOptional = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return null
    const parsed = Number(trimmed)
    return Number.isFinite(parsed) ? parsed : null
  }

  return {
    id: `pe-${crypto.randomUUID()}`,
    clientId,
    date: values.date || todayDateString(),
    weight: Number(values.weight),
    waist: parseOptional(values.waist),
    chest: parseOptional(values.chest),
    hips: parseOptional(values.hips),
    notes: values.notes.trim(),
    createdAt: new Date().toISOString(),
  }
}

export function sortProgressEntries(entries: ProgressEntry[]) {
  return [...entries].sort((a, b) => {
    if (a.date === b.date) {
      return b.createdAt.localeCompare(a.createdAt)
    }
    return b.date.localeCompare(a.date)
  })
}

export function getLatestProgressEntry(entries: ProgressEntry[]) {
  return sortProgressEntries(entries)[0] ?? null
}

export function getWeightTrend(entries: ProgressEntry[]) {
  const chronological = [...entries].sort((a, b) =>
    a.date.localeCompare(b.date)
  )
  if (chronological.length < 2) return null
  const first = chronological[0]
  const last = chronological[chronological.length - 1]
  return {
    delta: Number((last.weight - first.weight).toFixed(1)),
    from: first.weight,
    to: last.weight,
    fromDate: first.date,
    toDate: last.date,
  }
}
