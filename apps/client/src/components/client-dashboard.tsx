"use client"

import Link from "next/link"
import {
  Apple,
  CheckCircle2,
  Dumbbell,
  LineChart,
  Play,
  Plus,
  Utensils,
} from "lucide-react"

import { usePortal } from "@/components/portal-context"
import { Badge } from "@formfit/ui/badge"
import { Button } from "@formfit/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@formfit/ui/card"
import {
  formatSessionDate,
  getDailyMealLogNutrition,
  getLatestProgressEntry,
  getSessionProgress,
  getSuggestedTrainingDay,
  wasDayCompletedToday,
} from "@formfit/shared/portal-data"

function MacroBar({
  label,
  value,
  target,
  unit,
}: {
  label: string
  value: number
  target: number
  unit: string
}) {
  const percent =
    target <= 0 ? 0 : Math.min(100, Math.round((value / target) * 100))

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">
          {value}
          <span className="font-normal text-muted-foreground">
            {" "}
            / {target}
            {unit}
          </span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

export function ClientDashboard() {
  const {
    client,
    clientId,
    workoutPlan,
    dietPlan,
    sessions,
    progressEntries,
    todayMealLog,
    ensureTodayMealLog,
    getInProgressSession,
  } = usePortal()

  if (!client) return null

  const base = `/${clientId}`
  const suggestedDay = workoutPlan
    ? getSuggestedTrainingDay(workoutPlan, sessions)
    : null
  const inProgress = suggestedDay
    ? getInProgressSession(suggestedDay.id)
    : getInProgressSession()
  const dayDone = suggestedDay
    ? wasDayCompletedToday(sessions, suggestedDay.id, clientId)
    : false
  const nutrition = getDailyMealLogNutrition(todayMealLog)
  const latestProgress = getLatestProgressEntry(progressEntries)
  const recentSessions = sessions
    .filter((session) => session.status === "completed")
    .slice(0, 3)
  const firstName = client.fullName.split(" ")[0] ?? client.fullName

  const handleLogMeal = () => {
    ensureTodayMealLog()
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Client Portal</p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight">
          Hi, {firstName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your plans, workouts, meals, and progress in one place.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {suggestedDay && !suggestedDay.isRestDay ? (
          <Button
            nativeButton={false}
            className="h-auto flex-col gap-1 py-3"
            render={
              <Link href={`${base}/workouts/session/${suggestedDay.id}`} />
            }
          >
            <Play className="size-4" />
            Start Workout
          </Button>
        ) : (
          <Button className="h-auto flex-col gap-1 py-3" disabled>
            <Play className="size-4" />
            Start Workout
          </Button>
        )}
        <Button
            nativeButton={false}
          variant="outline"
          className="h-auto flex-col gap-1 py-3"
          render={<Link href={`${base}/diet`} />}
        >
          <Apple className="size-4" />
          View Diet Plan
        </Button>
        <Button
            nativeButton={false}
          variant="outline"
          className="h-auto flex-col gap-1 py-3"
          render={<Link href={`${base}/diet#log`} />}
          onClick={handleLogMeal}
        >
          <Utensils className="size-4" />
          Log Meal
        </Button>
        <Button
            nativeButton={false}
          variant="outline"
          className="h-auto flex-col gap-1 py-3"
          render={<Link href={`${base}/progress#add`} />}
        >
          <Plus className="size-4" />
          Add Progress
        </Button>
      </div>

      <Card className="shadow-none">
        <CardHeader className="border-b">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="size-4 text-primary" />
                Today&apos;s workout
              </CardTitle>
              <CardDescription className="mt-1">
                {workoutPlan?.name ?? "No workout plan assigned"}
              </CardDescription>
            </div>
            {dayDone ? (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="size-3" />
                Done
              </Badge>
            ) : inProgress ? (
              <Badge className="gap-1">In progress</Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-(--card-spacing)">
          {!workoutPlan || !suggestedDay ? (
            <p className="text-sm text-muted-foreground">
              Your coach hasn&apos;t assigned a workout plan yet. Check back
              soon.
            </p>
          ) : (
            <>
              <div>
                <p className="text-base font-medium">
                  {suggestedDay.name} · {suggestedDay.focus}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {suggestedDay.exercises.length} exercises
                  {inProgress
                    ? ` · ${getSessionProgress(inProgress).percent}% logged`
                    : null}
                </p>
              </div>
              <Button
                nativeButton={false}
                className="w-full sm:w-auto"
                render={
                  <Link href={`${base}/workouts/session/${suggestedDay.id}`} />
                }
              >
                {inProgress
                  ? "Continue Workout"
                  : dayDone
                    ? "Train Again"
                    : "Start Workout"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Apple className="size-4 text-primary" />
            Today&apos;s nutrition
          </CardTitle>
          <CardDescription>
            {dietPlan
              ? `${dietPlan.name} · targets vs logged intake`
              : "No diet plan assigned"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-(--card-spacing)">
          {!dietPlan ? (
            <p className="text-sm text-muted-foreground">
              Once your coach assigns a diet plan, you can log meals here.
            </p>
          ) : (
            <>
              <MacroBar
                label="Calories"
                value={nutrition.calories}
                target={dietPlan.calorieTarget}
                unit=" kcal"
              />
              <div className="grid gap-3 sm:grid-cols-3">
                <MacroBar
                  label="Protein"
                  value={nutrition.protein}
                  target={dietPlan.proteinTarget}
                  unit="g"
                />
                <MacroBar
                  label="Carbs"
                  value={nutrition.carbs}
                  target={dietPlan.carbsTarget}
                  unit="g"
                />
                <MacroBar
                  label="Fat"
                  value={nutrition.fat}
                  target={dietPlan.fatTarget}
                  unit="g"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-sm">Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No completed workouts yet. Start one when you&apos;re ready.
              </p>
            ) : (
              recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-start justify-between gap-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {session.dayName} · {session.dayFocus}
                    </p>
                    <p className="text-muted-foreground">
                      {formatSessionDate(session.completedAt ?? session.startedAt)}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {getSessionProgress(session).percent}%
                  </Badge>
                </div>
              ))
            )}
            <Button
            nativeButton={false}
              variant="ghost"
              size="sm"
              className="px-0"
              render={<Link href={`${base}/workouts`} />}
            >
              View workout plan
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <LineChart className="size-4 text-primary" />
              Progress snapshot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {latestProgress ? (
              <>
                <p className="text-3xl font-medium tabular-nums">
                  {latestProgress.weight}
                  <span className="ml-1 text-base font-normal text-muted-foreground">
                    kg
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Last logged {formatSessionDate(latestProgress.date)}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No progress entries yet. Log your weight to start a trend.
              </p>
            )}
            <Button
            nativeButton={false}
              variant="ghost"
              size="sm"
              className="px-0"
              render={<Link href={`${base}/progress`} />}
            >
              Open progress
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
