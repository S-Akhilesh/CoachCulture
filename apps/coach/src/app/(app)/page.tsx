import { KpiCards } from "@/components/dashboard/kpi-cards"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { TodaySchedule } from "@/components/dashboard/today-schedule"
import { WorkoutChart } from "@/components/dashboard/workout-chart"

export default function DashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <KpiCards />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <WorkoutChart />
        </div>
        <div className="lg:col-span-2">
          <TodaySchedule />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <RecentActivity />
        </div>
        <div className="lg:col-span-2">
          <QuickActions />
        </div>
      </div>
    </div>
  )
}
