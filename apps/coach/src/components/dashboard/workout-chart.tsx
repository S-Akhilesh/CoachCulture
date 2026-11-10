"use client"

import { useEffect, useRef, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@formfit/ui/card"
import { weeklyWorkoutActivity } from "@formfit/shared/mock-data"

const CHART_GREEN = "#3f8f6b"
const CHART_HEIGHT = 288

export function WorkoutChart() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const node = containerRef.current
    if (!node) return

    const updateWidth = () => {
      setWidth(node.getBoundingClientRect().width)
    }

    updateWidth()

    const observer = new ResizeObserver(updateWidth)
    observer.observe(node)

    return () => observer.disconnect()
  }, [])

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>Workout activity</CardTitle>
        <CardDescription>
          Completed client workouts this week
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="h-72 w-full min-w-0">
          {width > 0 ? (
            <BarChart
              width={width}
              height={CHART_HEIGHT}
              data={weeklyWorkoutActivity}
              margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
            >
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke="#e5e7eb"
              />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6b7280", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6b7280", fontSize: 12 }}
                allowDecimals={false}
                domain={[0, "auto"]}
              />
              <Tooltip
                cursor={{ fill: "#f3f4f6" }}
                contentStyle={{
                  borderRadius: "0.5rem",
                  border: "1px solid #e5e7eb",
                  background: "#ffffff",
                  color: "#111827",
                  boxShadow: "none",
                  fontSize: "0.875rem",
                }}
                formatter={(value) => [
                  `${String(value)} workouts`,
                  "Completed",
                ]}
              />
              <Bar
                dataKey="completed"
                fill={CHART_GREEN}
                radius={[6, 6, 0, 0]}
                maxBarSize={44}
                isAnimationActive={false}
              />
            </BarChart>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
