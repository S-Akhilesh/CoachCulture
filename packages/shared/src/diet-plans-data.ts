export type DietPlanStatus = "draft" | "active"

export type DietGoal =
  | "Muscle Gain"
  | "Fat Loss"
  | "Maintenance"
  | "General Health"

export type NutritionMacros = {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export type FoodLibraryItem = {
  id: string
  name: string
  servingSize: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

export type DietFoodItem = {
  id: string
  foodId: string
  name: string
  servingSize: string
  quantity: number
  baseCalories: number
  baseProtein: number
  baseCarbs: number
  baseFat: number
  notes: string
}

export type DietMeal = {
  id: string
  name: string
  timing: string
  notes: string
  foods: DietFoodItem[]
}

export type DietPlan = {
  id: string
  name: string
  goal: DietGoal
  description: string
  calorieTarget: number
  proteinTarget: number
  carbsTarget: number
  fatTarget: number
  status: DietPlanStatus
  meals: DietMeal[]
  assignedClientIds: string[]
  updatedAt: string
}

export type DietPlanDraft = Omit<DietPlan, "id" | "updatedAt"> & {
  id?: string
}

export const dietGoals: DietGoal[] = [
  "Muscle Gain",
  "Fat Loss",
  "Maintenance",
  "General Health",
]

export const foodLibrary: FoodLibraryItem[] = [
  {
    id: "food1",
    name: "Oats",
    servingSize: "40g dry",
    calories: 150,
    protein: 5,
    carbs: 27,
    fat: 3,
  },
  {
    id: "food2",
    name: "Eggs",
    servingSize: "1 large egg",
    calories: 72,
    protein: 6.3,
    carbs: 0.4,
    fat: 4.8,
  },
  {
    id: "food3",
    name: "Chicken breast",
    servingSize: "100g cooked",
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
  },
  {
    id: "food4",
    name: "Cooked rice",
    servingSize: "100g cooked",
    calories: 130,
    protein: 2.7,
    carbs: 28,
    fat: 0.3,
  },
  {
    id: "food5",
    name: "Paneer",
    servingSize: "50g",
    calories: 148,
    protein: 9,
    carbs: 2,
    fat: 11.5,
  },
  {
    id: "food6",
    name: "Greek yogurt",
    servingSize: "150g",
    calories: 130,
    protein: 15,
    carbs: 6,
    fat: 4,
  },
  {
    id: "food7",
    name: "Banana",
    servingSize: "1 medium",
    calories: 105,
    protein: 1.3,
    carbs: 27,
    fat: 0.4,
  },
  {
    id: "food8",
    name: "Almonds",
    servingSize: "20g",
    calories: 116,
    protein: 4.2,
    carbs: 4.3,
    fat: 10,
  },
  {
    id: "food9",
    name: "Whole wheat roti",
    servingSize: "1 roti (40g)",
    calories: 120,
    protein: 4,
    carbs: 22,
    fat: 2,
  },
  {
    id: "food10",
    name: "Salmon",
    servingSize: "100g cooked",
    calories: 208,
    protein: 22,
    carbs: 0,
    fat: 13,
  },
  {
    id: "food11",
    name: "Whey protein",
    servingSize: "1 scoop (30g)",
    calories: 120,
    protein: 24,
    carbs: 2,
    fat: 1.5,
  },
]

function round(value: number, decimals = 0) {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

export function scaleNutrition(
  base: NutritionMacros,
  quantity: number
): NutritionMacros {
  return {
    calories: round(base.calories * quantity),
    protein: round(base.protein * quantity, 1),
    carbs: round(base.carbs * quantity, 1),
    fat: round(base.fat * quantity, 1),
  }
}

export function sumNutrition(items: NutritionMacros[]): NutritionMacros {
  return items.reduce(
    (total, item) => ({
      calories: round(total.calories + item.calories),
      protein: round(total.protein + item.protein, 1),
      carbs: round(total.carbs + item.carbs, 1),
      fat: round(total.fat + item.fat, 1),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
}

export function getFoodItemNutrition(item: DietFoodItem): NutritionMacros {
  return scaleNutrition(
    {
      calories: item.baseCalories,
      protein: item.baseProtein,
      carbs: item.baseCarbs,
      fat: item.baseFat,
    },
    item.quantity
  )
}

export function getMealNutrition(meal: DietMeal): NutritionMacros {
  return sumNutrition(meal.foods.map(getFoodItemNutrition))
}

export function getPlanNutrition(plan: {
  meals: DietMeal[]
}): NutritionMacros {
  return sumNutrition(plan.meals.map(getMealNutrition))
}

export function getNutritionDelta(
  actual: NutritionMacros,
  target: NutritionMacros
): NutritionMacros {
  return {
    calories: round(actual.calories - target.calories),
    protein: round(actual.protein - target.protein, 1),
    carbs: round(actual.carbs - target.carbs, 1),
    fat: round(actual.fat - target.fat, 1),
  }
}

export function countMeals(plan: { meals: DietMeal[] }) {
  return plan.meals.length
}

export function createFoodFromLibrary(
  food: FoodLibraryItem,
  quantity = 1
): DietFoodItem {
  return {
    id: `df-${crypto.randomUUID()}`,
    foodId: food.id,
    name: food.name,
    servingSize: food.servingSize,
    quantity,
    baseCalories: food.calories,
    baseProtein: food.protein,
    baseCarbs: food.carbs,
    baseFat: food.fat,
    notes: "",
  }
}

export function createEmptyMeal(index: number): DietMeal {
  return {
    id: `meal-${crypto.randomUUID()}`,
    name: `Meal ${index}`,
    timing: "",
    notes: "",
    foods: [],
  }
}

export function createEmptyDietDraft(): DietPlanDraft {
  return {
    name: "",
    goal: "General Health",
    description: "",
    calorieTarget: 2000,
    proteinTarget: 140,
    carbsTarget: 200,
    fatTarget: 65,
    status: "draft",
    assignedClientIds: [],
    meals: [
      {
        id: "meal-temp-1",
        name: "Breakfast",
        timing: "8:00 AM",
        notes: "",
        foods: [],
      },
      {
        id: "meal-temp-2",
        name: "Lunch",
        timing: "1:00 PM",
        notes: "",
        foods: [],
      },
      {
        id: "meal-temp-3",
        name: "Dinner",
        timing: "7:30 PM",
        notes: "",
        foods: [],
      },
    ],
  }
}

function makeFood(
  foodId: string,
  quantity: number,
  notes = ""
): DietFoodItem {
  const food = foodLibrary.find((item) => item.id === foodId)!
  return {
    id: `df-${foodId}-${quantity}`,
    foodId: food.id,
    name: food.name,
    servingSize: food.servingSize,
    quantity,
    baseCalories: food.calories,
    baseProtein: food.protein,
    baseCarbs: food.carbs,
    baseFat: food.fat,
    notes,
  }
}

export const initialDietPlans: DietPlan[] = [
  {
    id: "dp1",
    name: "Muscle Gain — 2,400 kcal",
    goal: "Muscle Gain",
    description:
      "Higher-protein surplus plan for clients building lean mass with progressive training.",
    calorieTarget: 2400,
    proteinTarget: 180,
    carbsTarget: 260,
    fatTarget: 70,
    status: "active",
    assignedClientIds: ["c1", "c5"],
    updatedAt: "2026-11-03",
    meals: [
      {
        id: "dp1-m1",
        name: "Breakfast",
        timing: "8:00 AM",
        notes: "Eat within an hour of waking.",
        foods: [
          makeFood("food1", 1.5, "Cook with water or skim milk."),
          makeFood("food2", 3),
          makeFood("food7", 1),
        ],
      },
      {
        id: "dp1-m2",
        name: "Mid-morning snack",
        timing: "11:00 AM",
        notes: "",
        foods: [makeFood("food6", 1), makeFood("food8", 1)],
      },
      {
        id: "dp1-m3",
        name: "Lunch",
        timing: "1:30 PM",
        notes: "",
        foods: [
          makeFood("food3", 1.5),
          makeFood("food4", 1.5),
          makeFood("food9", 1),
        ],
      },
      {
        id: "dp1-m4",
        name: "Evening snack",
        timing: "5:00 PM",
        notes: "Use as a pre-workout option.",
        foods: [makeFood("food11", 1), makeFood("food7", 1)],
      },
      {
        id: "dp1-m5",
        name: "Dinner",
        timing: "8:00 PM",
        notes: "",
        foods: [makeFood("food10", 1.2), makeFood("food4", 1)],
      },
    ],
  },
  {
    id: "dp2",
    name: "Fat Loss — 1,800 kcal",
    goal: "Fat Loss",
    description:
      "Controlled deficit with high protein to preserve muscle during a cut phase.",
    calorieTarget: 1800,
    proteinTarget: 150,
    carbsTarget: 160,
    fatTarget: 55,
    status: "active",
    assignedClientIds: ["c2"],
    updatedAt: "2026-11-05",
    meals: [
      {
        id: "dp2-m1",
        name: "Breakfast",
        timing: "8:30 AM",
        notes: "",
        foods: [makeFood("food2", 2), makeFood("food6", 1)],
      },
      {
        id: "dp2-m2",
        name: "Lunch",
        timing: "1:00 PM",
        notes: "Keep oils light when cooking.",
        foods: [makeFood("food3", 1.2), makeFood("food9", 2)],
      },
      {
        id: "dp2-m3",
        name: "Evening snack",
        timing: "4:30 PM",
        notes: "",
        foods: [makeFood("food11", 1), makeFood("food8", 0.5)],
      },
      {
        id: "dp2-m4",
        name: "Dinner",
        timing: "7:30 PM",
        notes: "",
        foods: [makeFood("food10", 1), makeFood("food4", 0.8)],
      },
    ],
  },
  {
    id: "dp3",
    name: "Balanced Nutrition — 2,000 kcal",
    goal: "Maintenance",
    description:
      "Steady maintenance template for general fitness clients with flexible meal timing.",
    calorieTarget: 2000,
    proteinTarget: 140,
    carbsTarget: 210,
    fatTarget: 65,
    status: "draft",
    assignedClientIds: [],
    updatedAt: "2026-11-07",
    meals: [
      {
        id: "dp3-m1",
        name: "Breakfast",
        timing: "8:00 AM",
        notes: "",
        foods: [makeFood("food1", 1), makeFood("food6", 1), makeFood("food7", 1)],
      },
      {
        id: "dp3-m2",
        name: "Lunch",
        timing: "1:00 PM",
        notes: "",
        foods: [
          makeFood("food3", 1),
          makeFood("food4", 1),
          makeFood("food5", 1),
        ],
      },
      {
        id: "dp3-m3",
        name: "Dinner",
        timing: "7:30 PM",
        notes: "",
        foods: [makeFood("food10", 1), makeFood("food9", 2)],
      },
    ],
  },
  {
    id: "dp4",
    name: "General Health Reset",
    goal: "General Health",
    description:
      "Simple whole-food plan for clients restarting nutrition habits after travel.",
    calorieTarget: 1900,
    proteinTarget: 120,
    carbsTarget: 190,
    fatTarget: 60,
    status: "active",
    assignedClientIds: ["c4", "c7"],
    updatedAt: "2026-10-30",
    meals: [
      {
        id: "dp4-m1",
        name: "Breakfast",
        timing: "9:00 AM",
        notes: "",
        foods: [makeFood("food2", 2), makeFood("food9", 1), makeFood("food7", 1)],
      },
      {
        id: "dp4-m2",
        name: "Lunch",
        timing: "1:30 PM",
        notes: "",
        foods: [makeFood("food3", 1), makeFood("food4", 1)],
      },
      {
        id: "dp4-m3",
        name: "Dinner",
        timing: "8:00 PM",
        notes: "",
        foods: [makeFood("food5", 1.5), makeFood("food9", 2)],
      },
    ],
  },
]
