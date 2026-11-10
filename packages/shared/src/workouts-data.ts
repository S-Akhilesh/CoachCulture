export type WorkoutStatus = "draft" | "active"

export type WorkoutGoal =
  | "Muscle Gain"
  | "Fat Loss"
  | "General Fitness"
  | "Strength"
  | "Athletic Performance"

export type ExerciseLibraryItem = {
  id: string
  name: string
  muscleGroup: string
  equipment: string
}

export type WorkoutExercise = {
  id: string
  libraryExerciseId: string
  name: string
  muscleGroup: string
  equipment: string
  sets: number
  reps: string
  restSeconds: number
  notes: string
}

export type WorkoutDay = {
  id: string
  name: string
  focus: string
  isRestDay: boolean
  exercises: WorkoutExercise[]
}

export type WorkoutPlan = {
  id: string
  name: string
  goal: WorkoutGoal
  description: string
  daysPerWeek: number
  status: WorkoutStatus
  days: WorkoutDay[]
  assignedClientIds: string[]
  updatedAt: string
}

export type WorkoutPlanDraft = Omit<WorkoutPlan, "id" | "updatedAt"> & {
  id?: string
}

export const workoutGoals: WorkoutGoal[] = [
  "Muscle Gain",
  "Fat Loss",
  "General Fitness",
  "Strength",
  "Athletic Performance",
]

export const dayFocusOptions = [
  "Upper Body",
  "Lower Body",
  "Full Body",
  "Push",
  "Pull",
  "Legs",
  "Core & Conditioning",
  "Rest / Recovery",
] as const

export const exerciseLibrary: ExerciseLibraryItem[] = [
  {
    id: "ex1",
    name: "Barbell Bench Press",
    muscleGroup: "Chest",
    equipment: "Barbell",
  },
  {
    id: "ex2",
    name: "Lat Pulldown",
    muscleGroup: "Back",
    equipment: "Cable Machine",
  },
  {
    id: "ex3",
    name: "Dumbbell Shoulder Press",
    muscleGroup: "Shoulders",
    equipment: "Dumbbells",
  },
  {
    id: "ex4",
    name: "Barbell Squat",
    muscleGroup: "Quads",
    equipment: "Barbell",
  },
  {
    id: "ex5",
    name: "Romanian Deadlift",
    muscleGroup: "Hamstrings",
    equipment: "Barbell",
  },
  {
    id: "ex6",
    name: "Seated Cable Row",
    muscleGroup: "Back",
    equipment: "Cable Machine",
  },
  {
    id: "ex7",
    name: "Dumbbell Curl",
    muscleGroup: "Biceps",
    equipment: "Dumbbells",
  },
  {
    id: "ex8",
    name: "Triceps Pushdown",
    muscleGroup: "Triceps",
    equipment: "Cable Machine",
  },
  {
    id: "ex9",
    name: "Walking Lunges",
    muscleGroup: "Glutes",
    equipment: "Dumbbells",
  },
  {
    id: "ex10",
    name: "Plank",
    muscleGroup: "Core",
    equipment: "Bodyweight",
  },
]

function makeExercise(
  libraryId: string,
  sets: number,
  reps: string,
  restSeconds: number,
  notes = ""
): WorkoutExercise {
  const libraryItem = exerciseLibrary.find((item) => item.id === libraryId)!

  return {
    id: `we-${libraryId}-${sets}-${reps}`,
    libraryExerciseId: libraryItem.id,
    name: libraryItem.name,
    muscleGroup: libraryItem.muscleGroup,
    equipment: libraryItem.equipment,
    sets,
    reps,
    restSeconds,
    notes,
  }
}

export function countExercises(plan: Pick<WorkoutPlan, "days">) {
  return plan.days.reduce((total, day) => total + day.exercises.length, 0)
}

export function countTrainingDays(plan: Pick<WorkoutPlan, "days">) {
  return plan.days.filter((day) => !day.isRestDay).length
}

export function createEmptyDraft(): WorkoutPlanDraft {
  return {
    name: "",
    goal: "General Fitness",
    description: "",
    daysPerWeek: 3,
    status: "draft",
    days: [
      {
        id: "day-temp-1",
        name: "Day 1",
        focus: "Upper Body",
        isRestDay: false,
        exercises: [],
      },
      {
        id: "day-temp-2",
        name: "Day 2",
        focus: "Lower Body",
        isRestDay: false,
        exercises: [],
      },
      {
        id: "day-temp-3",
        name: "Day 3",
        focus: "Rest / Recovery",
        isRestDay: true,
        exercises: [],
      },
    ],
    assignedClientIds: [],
  }
}

export function createExerciseFromLibrary(
  item: ExerciseLibraryItem
): WorkoutExercise {
  return {
    id: `we-${crypto.randomUUID()}`,
    libraryExerciseId: item.id,
    name: item.name,
    muscleGroup: item.muscleGroup,
    equipment: item.equipment,
    sets: 3,
    reps: "8-12",
    restSeconds: 90,
    notes: "",
  }
}

export function createWorkoutDay(index: number): WorkoutDay {
  return {
    id: `day-${crypto.randomUUID()}`,
    name: `Day ${index}`,
    focus: "Full Body",
    isRestDay: false,
    exercises: [],
  }
}

export const initialWorkoutPlans: WorkoutPlan[] = [
  {
    id: "wp1",
    name: "Upper/Lower Strength A",
    goal: "Strength",
    description:
      "Four-day upper/lower rotation focused on progressive overload for intermediate lifters.",
    daysPerWeek: 4,
    status: "active",
    assignedClientIds: ["c1", "c5"],
    updatedAt: "2026-11-02",
    days: [
      {
        id: "wp1-d1",
        name: "Day 1",
        focus: "Upper Body",
        isRestDay: false,
        exercises: [
          makeExercise("ex1", 4, "5-8", 180, "Pause on the chest for control."),
          makeExercise("ex2", 3, "8-12", 90),
          makeExercise("ex3", 3, "8-10", 90),
          makeExercise("ex6", 3, "10-12", 75),
        ],
      },
      {
        id: "wp1-d2",
        name: "Day 2",
        focus: "Lower Body",
        isRestDay: false,
        exercises: [
          makeExercise("ex4", 4, "5-8", 180),
          makeExercise("ex5", 3, "8-10", 120),
          makeExercise("ex9", 3, "10/leg", 75),
        ],
      },
      {
        id: "wp1-d3",
        name: "Day 3",
        focus: "Rest / Recovery",
        isRestDay: true,
        exercises: [],
      },
      {
        id: "wp1-d4",
        name: "Day 4",
        focus: "Upper Body",
        isRestDay: false,
        exercises: [
          makeExercise("ex1", 3, "6-8", 150),
          makeExercise("ex6", 4, "8-12", 90),
          makeExercise("ex7", 3, "10-12", 60),
          makeExercise("ex8", 3, "10-12", 60),
        ],
      },
    ],
  },
  {
    id: "wp2",
    name: "Beginner Full Body",
    goal: "General Fitness",
    description:
      "Three full-body sessions per week for newer clients building confidence and form.",
    daysPerWeek: 3,
    status: "active",
    assignedClientIds: ["c4", "c7"],
    updatedAt: "2026-10-28",
    days: [
      {
        id: "wp2-d1",
        name: "Day 1",
        focus: "Full Body",
        isRestDay: false,
        exercises: [
          makeExercise("ex4", 3, "8-10", 120, "Box squat if needed."),
          makeExercise("ex1", 3, "8-10", 120),
          makeExercise("ex2", 3, "10-12", 90),
          makeExercise("ex10", 3, "30s", 45),
        ],
      },
      {
        id: "wp2-d2",
        name: "Day 2",
        focus: "Rest / Recovery",
        isRestDay: true,
        exercises: [],
      },
      {
        id: "wp2-d3",
        name: "Day 3",
        focus: "Full Body",
        isRestDay: false,
        exercises: [
          makeExercise("ex5", 3, "8-10", 120),
          makeExercise("ex3", 3, "10-12", 90),
          makeExercise("ex6", 3, "10-12", 90),
          makeExercise("ex7", 2, "12-15", 60),
        ],
      },
    ],
  },
  {
    id: "wp3",
    name: "4-Day Hypertrophy Split",
    goal: "Muscle Gain",
    description:
      "Push/pull/legs style hypertrophy block with higher volume accessory work.",
    daysPerWeek: 4,
    status: "draft",
    assignedClientIds: [],
    updatedAt: "2026-11-06",
    days: [
      {
        id: "wp3-d1",
        name: "Day 1",
        focus: "Push",
        isRestDay: false,
        exercises: [
          makeExercise("ex1", 4, "8-12", 120),
          makeExercise("ex3", 3, "10-12", 90),
          makeExercise("ex8", 3, "12-15", 60),
        ],
      },
      {
        id: "wp3-d2",
        name: "Day 2",
        focus: "Pull",
        isRestDay: false,
        exercises: [
          makeExercise("ex2", 4, "8-12", 90),
          makeExercise("ex6", 3, "10-12", 90),
          makeExercise("ex7", 3, "12-15", 60),
        ],
      },
      {
        id: "wp3-d3",
        name: "Day 3",
        focus: "Legs",
        isRestDay: false,
        exercises: [
          makeExercise("ex4", 4, "8-10", 150),
          makeExercise("ex5", 3, "8-12", 120),
          makeExercise("ex9", 3, "12/leg", 75),
        ],
      },
      {
        id: "wp3-d4",
        name: "Day 4",
        focus: "Rest / Recovery",
        isRestDay: true,
        exercises: [],
      },
    ],
  },
  {
    id: "wp4",
    name: "Fat Loss Conditioning Circuit",
    goal: "Fat Loss",
    description:
      "Metabolic circuit emphasis with shorter rest periods for active cutting clients.",
    daysPerWeek: 3,
    status: "active",
    assignedClientIds: ["c2"],
    updatedAt: "2026-11-04",
    days: [
      {
        id: "wp4-d1",
        name: "Day 1",
        focus: "Full Body",
        isRestDay: false,
        exercises: [
          makeExercise("ex4", 3, "12-15", 60),
          makeExercise("ex1", 3, "12-15", 60),
          makeExercise("ex6", 3, "12-15", 60),
          makeExercise("ex10", 3, "40s", 30),
        ],
      },
      {
        id: "wp4-d2",
        name: "Day 2",
        focus: "Core & Conditioning",
        isRestDay: false,
        exercises: [
          makeExercise("ex9", 3, "12/leg", 45),
          makeExercise("ex3", 3, "12-15", 60),
          makeExercise("ex8", 3, "15", 45),
        ],
      },
      {
        id: "wp4-d3",
        name: "Day 3",
        focus: "Rest / Recovery",
        isRestDay: true,
        exercises: [],
      },
    ],
  },
]
