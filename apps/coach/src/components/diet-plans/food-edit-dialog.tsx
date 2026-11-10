"use client"

import { useEffect, useMemo, useState } from "react"

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
import {
  type DietFoodItem,
  getFoodItemNutrition,
} from "@formfit/shared/diet-plans-data"

type FoodEditDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  food: DietFoodItem | null
  onSave: (food: DietFoodItem) => void
}

export function FoodEditDialog({
  open,
  onOpenChange,
  food,
  onSave,
}: FoodEditDialogProps) {
  const [draft, setDraft] = useState<DietFoodItem | null>(null)

  useEffect(() => {
    if (!open || !food) return
    setDraft(food)
  }, [food, open])

  const nutrition = useMemo(
    () => (draft ? getFoodItemNutrition(draft) : null),
    [draft]
  )

  if (!draft) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit food item</DialogTitle>
          <DialogDescription>
            Adjust quantity and notes for {draft.name}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Food</Label>
            <Input value={draft.name} disabled />
            <p className="text-xs text-muted-foreground">
              Serving size: {draft.servingSize}
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="food-quantity">Quantity (servings)</Label>
            <Input
              id="food-quantity"
              type="number"
              min={0.25}
              step={0.25}
              value={draft.quantity}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  quantity: Math.max(
                    0.25,
                    Number(event.target.value) || 0.25
                  ),
                })
              }
            />
          </div>

          {nutrition ? (
            <p className="text-sm text-muted-foreground">
              {nutrition.calories} kcal · P {nutrition.protein}g · C{" "}
              {nutrition.carbs}g · F {nutrition.fat}g
            </p>
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor="food-notes">Notes</Label>
            <Textarea
              id="food-notes"
              value={draft.notes}
              onChange={(event) =>
                setDraft({ ...draft, notes: event.target.value })
              }
              placeholder="Preparation notes, substitutions..."
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
            Save food
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
