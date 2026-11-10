"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"

import { Button } from "@formfit/ui/button"
import { Input } from "@formfit/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@formfit/ui/sheet"
import {
  type ExerciseLibraryItem,
  exerciseLibrary,
} from "@formfit/shared/workouts-data"

type ExerciseLibrarySheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (exercise: ExerciseLibraryItem) => void
}

export function ExerciseLibrarySheet({
  open,
  onOpenChange,
  onSelect,
}: ExerciseLibrarySheetProps) {
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return exerciseLibrary

    return exerciseLibrary.filter(
      (exercise) =>
        exercise.name.toLowerCase().includes(query) ||
        exercise.muscleGroup.toLowerCase().includes(query) ||
        exercise.equipment.toLowerCase().includes(query)
    )
  }, [search])

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) setSearch("")
      }}
    >
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader className="border-b border-border">
          <SheetTitle>Exercise library</SheetTitle>
          <SheetDescription>
            Pick an exercise to add to the selected training day.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-4">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search exercises..."
              className="h-9 bg-muted/40 pl-8"
            />
          </div>

          <div className="max-h-[calc(100svh-12rem)] space-y-2 overflow-y-auto pr-1">
            {filtered.map((exercise) => (
              <div
                key={exercise.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{exercise.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {exercise.muscleGroup} · {exercise.equipment}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onSelect(exercise)
                    onOpenChange(false)
                    setSearch("")
                  }}
                >
                  Add
                </Button>
              </div>
            ))}

            {filtered.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                No exercises match your search.
              </div>
            ) : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
