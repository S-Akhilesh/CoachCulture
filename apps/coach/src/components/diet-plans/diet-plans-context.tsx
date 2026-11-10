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
  type DietPlan,
  type DietPlanDraft,
} from "@formfit/shared/diet-plans-data"
import { loadDietPlans, saveDietPlans } from "@formfit/shared/diet-plans-storage"

type DietPlansContextValue = {
  plans: DietPlan[]
  isReady: boolean
  savePlan: (draft: DietPlanDraft, status: DietPlan["status"]) => DietPlan
  duplicatePlan: (planId: string) => DietPlan | null
  deletePlan: (planId: string) => void
  assignClients: (planId: string, clientIds: string[]) => void
  getPlan: (planId: string) => DietPlan | undefined
}

const DietPlansContext = createContext<DietPlansContextValue | null>(null)

export function DietPlansProvider({ children }: { children: React.ReactNode }) {
  const [plans, setPlans] = useState<DietPlan[]>([])
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setPlans(loadDietPlans())
    setIsReady(true)
  }, [])

  useEffect(() => {
    if (!isReady) return
    saveDietPlans(plans)
  }, [isReady, plans])

  const savePlan = useCallback(
    (draft: DietPlanDraft, status: DietPlan["status"]) => {
      const timestamp = new Date().toISOString().slice(0, 10)

      if (draft.id) {
        let updated: DietPlan | null = null
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

      const created: DietPlan = {
        ...draft,
        id: `dp-${crypto.randomUUID()}`,
        status,
        updatedAt: timestamp,
        meals: draft.meals.map((meal) => ({
          ...meal,
          id: meal.id.startsWith("meal-temp")
            ? `meal-${crypto.randomUUID()}`
            : meal.id,
        })),
      }

      setPlans((current) => [created, ...current])
      return created
    },
    []
  )

  const duplicatePlan = useCallback((planId: string) => {
    let duplicated: DietPlan | null = null

    setPlans((current) => {
      const source = current.find((plan) => plan.id === planId)
      if (!source) return current

      duplicated = {
        ...source,
        id: `dp-${crypto.randomUUID()}`,
        name: `${source.name} (Copy)`,
        status: "draft",
        assignedClientIds: [],
        updatedAt: new Date().toISOString().slice(0, 10),
        meals: source.meals.map((meal) => ({
          ...meal,
          id: `meal-${crypto.randomUUID()}`,
          foods: meal.foods.map((food) => ({
            ...food,
            id: `df-${crypto.randomUUID()}`,
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
    <DietPlansContext.Provider value={value}>
      {isReady ? (
        children
      ) : (
        <div className="mx-auto flex w-full max-w-7xl items-center justify-center py-24 text-sm text-muted-foreground">
          Loading diet plans...
        </div>
      )}
    </DietPlansContext.Provider>
  )
}

export function useDietPlans() {
  const context = useContext(DietPlansContext)
  if (!context) {
    throw new Error("useDietPlans must be used within DietPlansProvider")
  }
  return context
}
