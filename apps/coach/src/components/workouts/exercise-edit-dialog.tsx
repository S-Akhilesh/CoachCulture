"use client"

import { useEffect, useState } from "react"

import { Button } from "@formfit/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@formfit/ui/dialog"
import { Input } from "@formfit/ui/input"
import { Label } from "@formfit/ui/label"
import { Textarea } from "@formfit/ui/textarea"
import type { WorkoutExercise } from "@formfit/shared/workouts-data"

type ExerciseEditDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  exercise: WorkoutExercise | null
  onSave: (exercise: WorkoutExercise) => void
}

export function ExerciseEditDialog({
  open,
  onOpenChange,
  exercise,
  onSave,
}: ExerciseEditDialogProps) {
  const [draft, setDraft] = useState<WorkoutExercise | null>(null)

  useEffect(() => {
    if (!open || !exercise) return
    setDraft(exercise)
  }, [exercise, open])

  if (!draft) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit exercise</DialogTitle>
          <DialogDescription>
            Adjust sets, reps, rest, and coaching notes for {draft.name}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Exercise</Label>
            <Input value={draft.name} disabled />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="sets">Sets</Label>
              <Input
                id="sets"
                type="number"
                min={1}
                value={draft.sets}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    sets: Number(event.target.value) || 1,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reps">Reps</Label>
              <Input
                id="reps"
                value={draft.reps}
                onChange={(event) =>
                  setDraft({ ...draft, reps: event.target.value })
                }
                placeholder="8-12"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rest">Rest (sec)</Label>
              <Input
                id="rest"
                type="number"
                min={0}
                value={draft.restSeconds}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    restSeconds: Number(event.target.value) || 0,
                  })
                }
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Coach notes</Label>
            <Textarea
              id="notes"
              value={draft.notes}
              onChange={(event) =>
                setDraft({ ...draft, notes: event.target.value })
              }
              placeholder="Cue tempo, range of motion, substitutions..."
              className="min-h-20"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSave(draft)
              onOpenChange(false)
            }}
          >
            Save exercise
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
