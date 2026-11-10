"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  CartesianGrid,
  Line,
  LineChart,
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
import { type ProgressEntry, formatSessionDate } from "@formfit/shared/portal-data"

const CHART_GREEN = "#3f8f6b"
const CHART_HEIGHT = 240

export function WeightChart({ entries }: { entries: ProgressEntry[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  const data = useMemo(() => {
    return [...entries]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((entry) => ({
        date: entry.date,
        label: formatSessionDate(entry.date),
        weight: entry.weight,
      }))
  }, [entries])

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

  if (data.length === 0) {
    return (
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Weight trend</CardTitle>
          <CardDescription>Add entries to see your chart</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center rounded-lg bg-muted/40 text-sm text-muted-foreground">
            No weight data yet
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>Weight trend</CardTitle>
        <CardDescription>Body weight over time (kg)</CardDescription>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="h-60 w-full min-w-0">
          {width > 0 ? (
            <LineChart
              width={width}
              height={CHART_HEIGHT}
              data={data}
              margin={{ top: 8, right: 12, left: -8, bottom: 0 }}
            >
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke="#e5e7eb"
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6b7280", fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6b7280", fontSize: 12 }}
                domain={["auto", "auto"]}
                unit=" kg"
                width={48}
              />
              <Tooltip
                cursor={{ stroke: "#d1d5db" }}
                contentStyle={{
                  borderRadius: "0.5rem",
                  border: "1px solid #e5e7eb",
                  background: "#ffffff",
                  color: "#111827",
                  boxShadow: "none",
                  fontSize: "0.875rem",
                }}
                formatter={(value) => [`${String(value)} kg`, "Weight"]}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke={CHART_GREEN}
                strokeWidth={2.5}
                dot={{ r: 4, fill: CHART_GREEN }}
                isAnimationActive={false}
              />
            </LineChart>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
