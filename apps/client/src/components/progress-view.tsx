"use client"

import { useState } from "react"
import { LineChart, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { usePortal } from "@/components/portal-context"
import { WeightChart } from "@/components/weight-chart"
import { Button } from "@formfit/ui/button"
import { Input } from "@formfit/ui/input"
import { Label } from "@formfit/ui/label"
import { Textarea } from "@formfit/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@formfit/ui/card"
import {
  createEmptyProgressFormValues,
  formatSessionDate,
  getLatestProgressEntry,
  getWeightTrend,
  type ProgressFormValues,
} from "@formfit/shared/portal-data"

export function ProgressView() {
  const { progressEntries, addProgressEntry, deleteProgressEntry } =
    usePortal()
  const [form, setForm] = useState<ProgressFormValues>(
    createEmptyProgressFormValues()
  )

  const latest = getLatestProgressEntry(progressEntries)
  const trend = getWeightTrend(progressEntries)

  const updateField = <K extends keyof ProgressFormValues>(
    key: K,
    value: ProgressFormValues[K]
  ) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const created = addProgressEntry(form)
    if (!created) {
      toast.error("Enter a valid body weight")
      return
    }
    toast.success("Progress entry saved")
    setForm(
      createEmptyProgressFormValues({
        weight: String(created.weight),
      })
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Progress</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track weight and basic measurements
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <LineChart className="size-4 text-primary" />
              Latest weight
            </CardTitle>
          </CardHeader>
          <CardContent>
            {latest ? (
              <>
                <p className="text-3xl font-medium tabular-nums">
                  {latest.weight}
                  <span className="ml-1 text-base font-normal text-muted-foreground">
                    kg
                  </span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatSessionDate(latest.date)}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No entries yet</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-sm">Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {trend ? (
              <>
                <p className="text-3xl font-medium tabular-nums">
                  {trend.delta > 0 ? "+" : ""}
                  {trend.delta}
                  <span className="ml-1 text-base font-normal text-muted-foreground">
                    kg
                  </span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {trend.from} → {trend.to} kg
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Need at least two entries for a trend
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <WeightChart entries={progressEntries} />

      <Card id="add" className="shadow-none">
        <CardHeader className="border-b">
          <CardTitle>Add progress entry</CardTitle>
          <CardDescription>
            Body weight is required. Measurements are optional.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-(--card-spacing)">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="progress-date">Date</Label>
                <Input
                  id="progress-date"
                  type="date"
                  required
                  value={form.date}
                  onChange={(event) => updateField("date", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="progress-weight">Weight (kg)</Label>
                <Input
                  id="progress-weight"
                  type="number"
                  inputMode="decimal"
                  min={1}
                  step={0.1}
                  required
                  placeholder="72.5"
                  value={form.weight}
                  onChange={(event) =>
                    updateField("weight", event.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="progress-waist">Waist (cm)</Label>
                <Input
                  id="progress-waist"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={0.1}
                  placeholder="Optional"
                  value={form.waist}
                  onChange={(event) =>
                    updateField("waist", event.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="progress-chest">Chest (cm)</Label>
                <Input
                  id="progress-chest"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={0.1}
                  placeholder="Optional"
                  value={form.chest}
                  onChange={(event) =>
                    updateField("chest", event.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="progress-hips">Hips (cm)</Label>
                <Input
                  id="progress-hips"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={0.1}
                  placeholder="Optional"
                  value={form.hips}
                  onChange={(event) => updateField("hips", event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="progress-notes">Notes</Label>
              <Textarea
                id="progress-notes"
                placeholder="How are you feeling?"
                value={form.notes}
                onChange={(event) => updateField("notes", event.target.value)}
              />
            </div>

            <Button type="submit" className="w-full sm:w-auto">
              Save entry
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-sm font-medium">Recent entries</h2>
        {progressEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Your progress history will show up here.
          </p>
        ) : (
          progressEntries.map((entry) => (
            <Card key={entry.id} className="shadow-none" size="sm">
              <CardContent className="flex items-start justify-between gap-3 pt-(--card-spacing)">
                <div className="min-w-0 space-y-1">
                  <p className="font-medium tabular-nums">
                    {entry.weight} kg
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      {formatSessionDate(entry.date)}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {[
                      entry.waist != null ? `Waist ${entry.waist} cm` : null,
                      entry.chest != null ? `Chest ${entry.chest} cm` : null,
                      entry.hips != null ? `Hips ${entry.hips} cm` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "No measurements"}
                  </p>
                  {entry.notes ? (
                    <p className="text-sm text-muted-foreground">
                      {entry.notes}
                    </p>
                  ) : null}
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Delete entry"
                  onClick={() => {
                    deleteProgressEntry(entry.id)
                    toast.success("Entry deleted")
                  }}
                >
                  <Trash2 />
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
