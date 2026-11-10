"use client"

import { useState } from "react"

import { Header } from "@/components/dashboard/header"
import { PageHeaderProvider } from "@/components/dashboard/page-header-context"
import { Sidebar } from "@/components/dashboard/sidebar"

type DashboardShellProps = {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <PageHeaderProvider>
      <div className="flex h-svh overflow-hidden bg-muted/40">
        <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </PageHeaderProvider>
  )
}
