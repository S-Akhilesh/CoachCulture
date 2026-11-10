"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { usePathname } from "next/navigation"

import { coach } from "@formfit/shared/mock-data"

type PageHeaderContextValue = {
  title: string
  description: string
  actions: React.ReactNode
  setActions: (actions: React.ReactNode) => void
}

const PageHeaderContext = createContext<PageHeaderContextValue | null>(null)

function getHeaderCopy(pathname: string) {
  if (pathname.startsWith("/clients")) {
    return {
      title: "Clients",
      description: "Manage your coaching clients",
    }
  }

  if (pathname.startsWith("/workouts")) {
    const isBuilder =
      pathname.includes("/new") || pathname.includes("/edit")
    return {
      title: isBuilder ? "Workout Builder" : "Workouts",
      description: isBuilder
        ? "Design training days and exercises for your clients"
        : "Create and manage workout plans for your clients",
    }
  }

  if (pathname.startsWith("/diet-plans")) {
    const isBuilder =
      pathname.includes("/new") || pathname.includes("/edit")
    return {
      title: isBuilder ? "Diet Plan Builder" : "Diet Plans",
      description: isBuilder
        ? "Build meals and track nutrition targets for your clients"
        : "Create and manage nutrition plans for your clients",
    }
  }

  return {
    title: "Dashboard",
    description: `Good morning, ${coach.firstName}`,
  }
}

export function PageHeaderProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [actions, setActionsState] = useState<React.ReactNode>(null)
  const copy = useMemo(() => getHeaderCopy(pathname), [pathname])

  const setActions = useCallback((next: React.ReactNode) => {
    setActionsState(next)
  }, [])

  const value = useMemo(
    () => ({
      title: copy.title,
      description: copy.description,
      actions,
      setActions,
    }),
    [actions, copy.description, copy.title, setActions]
  )

  return (
    <PageHeaderContext.Provider value={value}>
      {children}
    </PageHeaderContext.Provider>
  )
}

export function usePageHeader() {
  const context = useContext(PageHeaderContext)
  if (!context) {
    throw new Error("usePageHeader must be used within PageHeaderProvider")
  }
  return context
}

export function usePageHeaderActions(actions: React.ReactNode) {
  const { setActions } = usePageHeader()

  useEffect(() => {
    setActions(actions)
    return () => setActions(null)
  }, [actions, setActions])
}
