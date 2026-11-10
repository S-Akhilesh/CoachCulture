"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

import { initialClients, type Client } from "@formfit/shared/clients-data"
import { loadDietPlans } from "@formfit/shared/diet-plans-storage"
import {
  type DailyMealLog,
  type MealLogEntry,
  type ProgressEntry,
  type ProgressFormValues,
  type WorkoutSession,
  createDailyMealLog,
  createProgressEntry,
  createWorkoutSession,
  getAssignedDietPlan,
  getAssignedWorkoutPlan,
  todayDateString,
} from "@formfit/shared/portal-data"
import {
  loadMealLogs,
  loadProgressEntries,
  loadWorkoutSessions,
  saveMealLogs,
  saveProgressEntries,
  saveWorkoutSessions,
} from "@formfit/shared/portal-storage"
import { type DietPlan } from "@formfit/shared/diet-plans-data"
import { type WorkoutDay, type WorkoutPlan } from "@formfit/shared/workouts-data"
import { loadWorkoutPlans } from "@formfit/shared/workouts-storage"

type PortalContextValue = {
  clientId: string
  client: Client | null
  isReady: boolean
  workoutPlan: WorkoutPlan | undefined
  dietPlan: DietPlan | undefined
  sessions: WorkoutSession[]
  mealLogs: DailyMealLog[]
  progressEntries: ProgressEntry[]
  todayMealLog: DailyMealLog | null
  getSessionsForClient: () => WorkoutSession[]
  getInProgressSession: (dayId?: string) => WorkoutSession | undefined
  getSession: (sessionId: string) => WorkoutSession | undefined
  startWorkout: (day: WorkoutDay) => WorkoutSession | null
  updateSession: (session: WorkoutSession) => void
  finishWorkout: (sessionId: string) => void
  ensureTodayMealLog: () => DailyMealLog | null
  updateMealLog: (log: DailyMealLog) => void
  updateMealEntry: (
    mealId: string,
    updater: (meal: MealLogEntry) => MealLogEntry
  ) => void
  addProgressEntry: (values: ProgressFormValues) => ProgressEntry | null
  deleteProgressEntry: (entryId: string) => void
}

const PortalContext = createContext<PortalContextValue | null>(null)

export function PortalProvider({
  clientId,
  profile,
  children,
}: {
  clientId: string
  profile?: { fullName: string; email: string }
  children: React.ReactNode
}) {
  const [isReady, setIsReady] = useState(false)
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([])
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([])
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [mealLogs, setMealLogs] = useState<DailyMealLog[]>([])
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([])

  const client = useMemo(() => {
    const mock = initialClients.find((item) => item.id === clientId)
    if (mock) return mock
    if (!profile) return null

    const today = new Date().toISOString().slice(0, 10)
    return {
      id: clientId,
      fullName: profile.fullName,
      email: profile.email,
      phone: "",
      fitnessGoal: "General Fitness",
      status: "active" as const,
      startDate: today,
      notes: "",
      assignedWorkoutPlan: null,
      assignedDietPlan: null,
    } satisfies Client
  }, [clientId, profile])

  useEffect(() => {
    setWorkoutPlans(loadWorkoutPlans())
    setDietPlans(loadDietPlans())
    setSessions(loadWorkoutSessions())
    setMealLogs(loadMealLogs())
    setProgressEntries(loadProgressEntries())
    setIsReady(true)
  }, [clientId])

  useEffect(() => {
    if (!isReady) return
    saveWorkoutSessions(sessions)
  }, [isReady, sessions])

  useEffect(() => {
    if (!isReady) return
    saveMealLogs(mealLogs)
  }, [isReady, mealLogs])

  useEffect(() => {
    if (!isReady) return
    saveProgressEntries(progressEntries)
  }, [isReady, progressEntries])

  const workoutPlan = useMemo(
    () => getAssignedWorkoutPlan(workoutPlans, clientId),
    [workoutPlans, clientId]
  )

  const dietPlan = useMemo(
    () => getAssignedDietPlan(dietPlans, clientId),
    [dietPlans, clientId]
  )

  const clientSessions = useMemo(
    () =>
      sessions
        .filter((session) => session.clientId === clientId)
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
    [sessions, clientId]
  )

  const clientMealLogs = useMemo(
    () => mealLogs.filter((log) => log.clientId === clientId),
    [mealLogs, clientId]
  )

  const clientProgress = useMemo(
    () =>
      progressEntries
        .filter((entry) => entry.clientId === clientId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [progressEntries, clientId]
  )

  const todayMealLog = useMemo(() => {
    const today = todayDateString()
    return (
      clientMealLogs.find(
        (log) =>
          log.date === today &&
          (!dietPlan || log.planId === dietPlan.id)
      ) ?? null
    )
  }, [clientMealLogs, dietPlan])

  const getSessionsForClient = useCallback(
    () => clientSessions,
    [clientSessions]
  )

  const getInProgressSession = useCallback(
    (dayId?: string) =>
      clientSessions.find(
        (session) =>
          session.status === "in_progress" &&
          (dayId ? session.dayId === dayId : true)
      ),
    [clientSessions]
  )

  const getSession = useCallback(
    (sessionId: string) =>
      clientSessions.find((session) => session.id === sessionId),
    [clientSessions]
  )

  const startWorkout = useCallback(
    (day: WorkoutDay) => {
      if (!workoutPlan || day.isRestDay) return null

      const existing = clientSessions.find(
        (session) =>
          session.status === "in_progress" && session.dayId === day.id
      )
      if (existing) return existing

      const created = createWorkoutSession(clientId, workoutPlan, day)
      setSessions((current) => [created, ...current])
      return created
    },
    [clientId, clientSessions, workoutPlan]
  )

  const updateSession = useCallback((session: WorkoutSession) => {
    setSessions((current) =>
      current.map((item) => (item.id === session.id ? session : item))
    )
  }, [])

  const finishWorkout = useCallback((sessionId: string) => {
    setSessions((current) =>
      current.map((session) => {
        if (session.id !== sessionId) return session
        return {
          ...session,
          status: "completed" as const,
          completedAt: new Date().toISOString(),
          exercises: session.exercises.map((exercise) => ({
            ...exercise,
            completed:
              exercise.completed ||
              exercise.sets.every((set) => set.completed),
          })),
        }
      })
    )
  }, [])

  const ensureTodayMealLog = useCallback(() => {
    if (!dietPlan) return null

    const today = todayDateString()
    const existing = mealLogs.find(
      (log) =>
        log.clientId === clientId &&
        log.date === today &&
        log.planId === dietPlan.id
    )
    if (existing) return existing

    const created = createDailyMealLog(clientId, dietPlan, today)
    setMealLogs((current) => {
      const alreadyThere = current.find(
        (log) =>
          log.clientId === clientId &&
          log.date === today &&
          log.planId === dietPlan.id
      )
      if (alreadyThere) return current
      return [created, ...current]
    })
    return created
  }, [clientId, dietPlan, mealLogs])

  const updateMealLog = useCallback((log: DailyMealLog) => {
    setMealLogs((current) => {
      const exists = current.some((item) => item.id === log.id)
      if (!exists) {
        return [{ ...log, updatedAt: new Date().toISOString() }, ...current]
      }
      return current.map((item) =>
        item.id === log.id
          ? { ...log, updatedAt: new Date().toISOString() }
          : item
      )
    })
  }, [])

  const updateMealEntry = useCallback(
    (mealId: string, updater: (meal: MealLogEntry) => MealLogEntry) => {
      if (!dietPlan) return

      const today = todayDateString()

      setMealLogs((current) => {
        const existing =
          current.find(
            (log) =>
              log.clientId === clientId &&
              log.date === today &&
              log.planId === dietPlan.id
          ) ?? createDailyMealLog(clientId, dietPlan, today)

        const next: DailyMealLog = {
          ...existing,
          meals: existing.meals.map((meal) =>
            meal.mealId === mealId ? updater(meal) : meal
          ),
          updatedAt: new Date().toISOString(),
        }

        const exists = current.some((item) => item.id === next.id)
        if (!exists) return [next, ...current]
        return current.map((item) => (item.id === next.id ? next : item))
      })
    },
    [clientId, dietPlan]
  )

  const addProgressEntry = useCallback(
    (values: ProgressFormValues) => {
      const weight = Number(values.weight)
      if (!Number.isFinite(weight) || weight <= 0) return null

      const created = createProgressEntry(clientId, values)
      setProgressEntries((current) => [created, ...current])
      return created
    },
    [clientId]
  )

  const deleteProgressEntry = useCallback((entryId: string) => {
    setProgressEntries((current) =>
      current.filter(
        (entry) => !(entry.id === entryId && entry.clientId === clientId)
      )
    )
  }, [clientId])

  const value = useMemo<PortalContextValue>(
    () => ({
      clientId,
      client,
      isReady,
      workoutPlan,
      dietPlan,
      sessions: clientSessions,
      mealLogs: clientMealLogs,
      progressEntries: clientProgress,
      todayMealLog,
      getSessionsForClient,
      getInProgressSession,
      getSession,
      startWorkout,
      updateSession,
      finishWorkout,
      ensureTodayMealLog,
      updateMealLog,
      updateMealEntry,
      addProgressEntry,
      deleteProgressEntry,
    }),
    [
      clientId,
      client,
      isReady,
      workoutPlan,
      dietPlan,
      clientSessions,
      clientMealLogs,
      clientProgress,
      todayMealLog,
      getSessionsForClient,
      getInProgressSession,
      getSession,
      startWorkout,
      updateSession,
      finishWorkout,
      ensureTodayMealLog,
      updateMealLog,
      updateMealEntry,
      addProgressEntry,
      deleteProgressEntry,
    ]
  )

  return (
    <PortalContext.Provider value={value}>{children}</PortalContext.Provider>
  )
}

export function usePortal() {
  const context = useContext(PortalContext)
  if (!context) {
    throw new Error("usePortal must be used within PortalProvider")
  }
  return context
}
