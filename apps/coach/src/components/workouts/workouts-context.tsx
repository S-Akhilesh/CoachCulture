"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  type WorkoutPlan,
  type WorkoutPlanDraft,
} from "@formfit/shared/workouts-data"
import { loadWorkoutPlans, saveWorkoutPlans } from "@formfit/shared/workouts-storage"

type WorkoutsContextValue = {
  plans: WorkoutPlan[]
  isReady: boolean
  savePlan: (draft: WorkoutPlanDraft, status: WorkoutPlan["status"]) => WorkoutPlan
  duplicatePlan: (planId: string) => WorkoutPlan | null
  deletePlan: (planId: string) => void
  assignClients: (planId: string, clientIds: string[]) => void
  getPlan: (planId: string) => WorkoutPlan | undefined
}

const WorkoutsContext = createContext<WorkoutsContextValue | null>(null)

export function WorkoutsProvider({ children }: { children: React.ReactNode }) {
  const [plans, setPlans] = useState<WorkoutPlan[]>([])
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setPlans(loadWorkoutPlans())
    setIsReady(true)
  }, [])

  useEffect(() => {
    if (!isReady) return
    saveWorkoutPlans(plans)
  }, [isReady, plans])

  const savePlan = useCallback(
    (draft: WorkoutPlanDraft, status: WorkoutPlan["status"]) => {
      const timestamp = new Date().toISOString().slice(0, 10)

      if (draft.id) {
        let updated: WorkoutPlan | null = null
        setPlans((current) =>
          current.map((plan) => {
            if (plan.id !== draft.id) return plan
            updated = {
              ...plan,
              ...draft,
              id: plan.id,
              status,
              updatedAt: timestamp,
            }
            return updated
          })
        )
        return (
          updated ?? {
            ...draft,
            id: draft.id,
            status,
            updatedAt: timestamp,
          }
        )
      }

      const created: WorkoutPlan = {
        ...draft,
        id: `wp-${crypto.randomUUID()}`,
        status,
        updatedAt: timestamp,
        days: draft.days.map((day) => ({
          ...day,
          id: day.id.startsWith("day-temp")
            ? `day-${crypto.randomUUID()}`
            : day.id,
        })),
      }

      setPlans((current) => [created, ...current])
      return created
    },
    []
  )

  const duplicatePlan = useCallback((planId: string) => {
    let duplicated: WorkoutPlan | null = null

    setPlans((current) => {
      const source = current.find((plan) => plan.id === planId)
      if (!source) return current

      duplicated = {
        ...source,
        id: `wp-${crypto.randomUUID()}`,
        name: `${source.name} (Copy)`,
        status: "draft",
        assignedClientIds: [],
        updatedAt: new Date().toISOString().slice(0, 10),
        days: source.days.map((day) => ({
          ...day,
          id: `day-${crypto.randomUUID()}`,
          exercises: day.exercises.map((exercise) => ({
            ...exercise,
            id: `we-${crypto.randomUUID()}`,
          })),
        })),
      }

      return [duplicated, ...current]
    })

    return duplicated
  }, [])

  const deletePlan = useCallback((planId: string) => {
    setPlans((current) => current.filter((plan) => plan.id !== planId))
  }, [])

  const assignClients = useCallback((planId: string, clientIds: string[]) => {
    setPlans((current) =>
      current.map((plan) =>
        plan.id === planId
          ? {
              ...plan,
              assignedClientIds: clientIds,
              updatedAt: new Date().toISOString().slice(0, 10),
            }
          : plan
      )
    )
  }, [])

  const getPlan = useCallback(
    (planId: string) => plans.find((plan) => plan.id === planId),
    [plans]
  )

  const value = useMemo(
    () => ({
      plans,
      isReady,
      savePlan,
      duplicatePlan,
      deletePlan,
      assignClients,
      getPlan,
    }),
    [
      assignClients,
      deletePlan,
      duplicatePlan,
      getPlan,
      isReady,
      plans,
      savePlan,
    ]
  )

  return (
    <WorkoutsContext.Provider value={value}>{children}</WorkoutsContext.Provider>
  )
}

export function useWorkouts() {
  const context = useContext(WorkoutsContext)
  if (!context) {
    throw new Error("useWorkouts must be used within WorkoutsProvider")
  }
  return context
}
