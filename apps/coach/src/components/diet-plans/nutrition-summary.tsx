import { cn } from "cn"

import {
  type NutritionMacros,
  getNutritionDelta,
} from "@formfit/shared/diet-plans-data"

type NutritionSummaryProps = {
  actual: NutritionMacros
  target?: NutritionMacros
  title?: string
  compact?: boolean
}

function formatDelta(value: number, unit = "") {
  const sign = value > 0 ? "+" : ""
  return `${sign}${value}${unit}`
}

export function NutritionSummary({
  actual,
  target,
  title = "Daily nutrition",
  compact = false,
}: NutritionSummaryProps) {
  const delta = target ? getNutritionDelta(actual, target) : null

  const rows = [
    {
      label: "Calories",
      actual: `${actual.calories} kcal`,
      target: target ? `${target.calories} kcal` : null,
      delta: delta ? formatDelta(delta.calories, " kcal") : null,
      over: delta ? delta.calories > 0 : false,
      under: delta ? delta.calories < 0 : false,
    },
    {
      label: "Protein",
      actual: `${actual.protein}g`,
      target: target ? `${target.protein}g` : null,
      delta: delta ? formatDelta(delta.protein, "g") : null,
      over: delta ? delta.protein > 0 : false,
      under: delta ? delta.protein < 0 : false,
    },
    {
      label: "Carbs",
      actual: `${actual.carbs}g`,
      target: target ? `${target.carbs}g` : null,
      delta: delta ? formatDelta(delta.carbs, "g") : null,
      over: delta ? delta.carbs > 0 : false,
      under: delta ? delta.carbs < 0 : false,
    },
    {
      label: "Fat",
      actual: `${actual.fat}g`,
      target: target ? `${target.fat}g` : null,
      delta: delta ? formatDelta(delta.fat, "g") : null,
      over: delta ? delta.fat > 0 : false,
      under: delta ? delta.fat < 0 : false,
    },
  ]

  return (
    <div
      className={cn(
        "rounded-lg border border-border",
        compact ? "p-3" : "p-4"
      )}
    >
      <p className="mb-3 text-sm font-medium">{title}</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map((row) => (
          <div key={row.label} className="space-y-1">
            <p className="text-xs text-muted-foreground">{row.label}</p>
            <p className="text-base font-semibold">{row.actual}</p>
            {row.target ? (
              <p className="text-xs text-muted-foreground">
                Target {row.target}
              </p>
            ) : null}
            {row.delta ? (
              <p
                className={cn(
                  "text-xs font-medium",
                  row.over && "text-amber-700",
                  row.under && "text-sky-700",
                  !row.over && !row.under && "text-emerald-700"
                )}
              >
                {row.delta === "+0 kcal" ||
                row.delta === "+0g" ||
                row.delta === "0 kcal" ||
                row.delta === "0g"
                  ? "On target"
                  : row.delta}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
