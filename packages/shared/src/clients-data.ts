export type ClientStatus = "active" | "inactive"

export type Client = {
  id: string
  fullName: string
  email: string
  phone: string
  fitnessGoal: string
  status: ClientStatus
  startDate: string
  notes: string
  assignedWorkoutPlan: string | null
  assignedDietPlan: string | null
}

export type ClientFormValues = {
  fullName: string
  email: string
  phone: string
  fitnessGoal: string
  status: ClientStatus
  startDate: string
  notes: string
}

export const fitnessGoals = [
  "Build Muscle",
  "Lose Weight",
  "Improve Endurance",
  "General Fitness",
  "Athletic Performance",
  "Mobility & Flexibility",
] as const

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

export function formatDisplayDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return date

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export const initialClients: Client[] = [
  {
    id: "c1",
    fullName: "Maya Chen",
    email: "maya.chen@email.com",
    phone: "+1 (415) 555-0142",
    fitnessGoal: "Build Muscle",
    status: "active",
    startDate: "2025-09-12",
    notes: "Prefers morning sessions. Working toward a March powerlifting meet.",
    assignedWorkoutPlan: "Upper/Lower Strength A",
    assignedDietPlan: "Muscle Gain 2,400 kcal",
  },
  {
    id: "c2",
    fullName: "Jordan Blake",
    email: "jordan.blake@email.com",
    phone: "+1 (628) 555-0198",
    fitnessGoal: "Lose Weight",
    status: "active",
    startDate: "2025-10-03",
    notes: "Currently in cut phase week 3. Tracks meals in MyFitnessPal.",
    assignedWorkoutPlan: "HIIT Conditioning Block",
    assignedDietPlan: "Cut Phase Week 3",
  },
  {
    id: "c3",
    fullName: "Priya Patel",
    email: "priya.patel@email.com",
    phone: "+1 (510) 555-0177",
    fitnessGoal: "Athletic Performance",
    status: "active",
    startDate: "2025-08-21",
    notes: "Training for a spring triathlon. Needs form checks on Olympic lifts.",
    assignedWorkoutPlan: "Hybrid Athlete Prep",
    assignedDietPlan: "Endurance Support 2,200 kcal",
  },
  {
    id: "c4",
    fullName: "Sam Okonkwo",
    email: "sam.okonkwo@email.com",
    phone: "+1 (925) 555-0133",
    fitnessGoal: "General Fitness",
    status: "active",
    startDate: "2025-11-01",
    notes: "New parent schedule. Prefers 45-minute sessions twice a week.",
    assignedWorkoutPlan: "Foundations Circuit",
    assignedDietPlan: null,
  },
  {
    id: "c5",
    fullName: "Elena Rossi",
    email: "elena.rossi@email.com",
    phone: "+1 (650) 555-0119",
    fitnessGoal: "Build Muscle",
    status: "active",
    startDate: "2025-07-14",
    notes: "Responds well to hypertrophy volume. Avoid high-impact plyometrics.",
    assignedWorkoutPlan: "Lower Body Hypertrophy B",
    assignedDietPlan: "High Protein Maintenance",
  },
  {
    id: "c6",
    fullName: "Chris Nguyen",
    email: "chris.nguyen@email.com",
    phone: "+1 (408) 555-0164",
    fitnessGoal: "Improve Endurance",
    status: "inactive",
    startDate: "2025-05-09",
    notes: "Paused coaching while traveling for work. Plans to resume in April.",
    assignedWorkoutPlan: null,
    assignedDietPlan: null,
  },
  {
    id: "c7",
    fullName: "Aisha Rahman",
    email: "aisha.rahman@email.com",
    phone: "+1 (707) 555-0188",
    fitnessGoal: "Mobility & Flexibility",
    status: "active",
    startDate: "2026-01-06",
    notes: "Recovering from desk-job tightness. Focus on hips and thoracic mobility.",
    assignedWorkoutPlan: "Mobility Reset",
    assignedDietPlan: "Anti-Inflammatory Basics",
  },
  {
    id: "c8",
    fullName: "Noah Berg",
    email: "noah.berg@email.com",
    phone: "+1 (831) 555-0125",
    fitnessGoal: "Lose Weight",
    status: "inactive",
    startDate: "2025-04-18",
    notes: "Completed 12-week cut. Currently on maintenance without weekly check-ins.",
    assignedWorkoutPlan: null,
    assignedDietPlan: "Maintenance Rebalance",
  },
]

export function createEmptyClientFormValues(
  startDate = ""
): ClientFormValues {
  return {
    fullName: "",
    email: "",
    phone: "",
    fitnessGoal: "General Fitness",
    status: "active",
    startDate,
    notes: "",
  }
}

export function clientToFormValues(client: Client): ClientFormValues {
  return {
    fullName: client.fullName,
    email: client.email,
    phone: client.phone,
    fitnessGoal: client.fitnessGoal,
    status: client.status,
    startDate: client.startDate,
    notes: client.notes,
  }
}
