"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"

import { Button } from "@formfit/ui/button"
import { Input } from "@formfit/ui/input"
import { Label } from "@formfit/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@formfit/ui/sheet"
import {
  type FoodLibraryItem,
  foodLibrary,
  scaleNutrition,
} from "@formfit/shared/diet-plans-data"

type FoodLibrarySheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (food: FoodLibraryItem, quantity: number) => void
}

export function FoodLibrarySheet({
  open,
  onOpenChange,
  onSelect,
}: FoodLibrarySheetProps) {
  const [search, setSearch] = useState("")
  const [selectedFood, setSelectedFood] = useState<FoodLibraryItem | null>(
    null
  )
  const [quantity, setQuantity] = useState(1)

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return foodLibrary

    return foodLibrary.filter(
      (food) =>
        food.name.toLowerCase().includes(query) ||
        food.servingSize.toLowerCase().includes(query)
    )
  }, [search])

  const preview = selectedFood
    ? scaleNutrition(
        {
          calories: selectedFood.calories,
          protein: selectedFood.protein,
          carbs: selectedFood.carbs,
          fat: selectedFood.fat,
        },
        quantity
      )
    : null

  function reset() {
    setSearch("")
    setSelectedFood(null)
    setQuantity(1)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) reset()
      }}
    >
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader className="border-b border-border">
          <SheetTitle>Food library</SheetTitle>
          <SheetDescription>
            Choose a food and adjust the serving quantity before adding it.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-4">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search foods..."
              className="h-9 bg-muted/40 pl-8"
            />
          </div>

          {selectedFood ? (
            <div className="space-y-3 rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">{selectedFood.name}</p>
                <p className="text-xs text-muted-foreground">
                  Per serving: {selectedFood.servingSize}
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity (servings)</Label>
                <Input
                  id="quantity"
                  type="number"
                  min={0.25}
                  step={0.25}
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(Math.max(0.25, Number(event.target.value) || 0.25))
                  }
                />
              </div>
              {preview ? (
                <p className="text-xs text-muted-foreground">
                  {preview.calories} kcal · P {preview.protein}g · C{" "}
                  {preview.carbs}g · F {preview.fat}g
                </p>
              ) : null}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedFood(null)}
                >
                  Back
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    onSelect(selectedFood, quantity)
                    onOpenChange(false)
                    reset()
                  }}
                >
                  Add food
                </Button>
              </div>
            </div>
          ) : (
            <div className="max-h-[calc(100svh-12rem)] space-y-2 overflow-y-auto pr-1">
              {filtered.map((food) => (
                <div
                  key={food.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{food.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {food.servingSize}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {food.calories} kcal · P {food.protein}g · C {food.carbs}
                      g · F {food.fat}g
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedFood(food)
                      setQuantity(1)
                    }}
                  >
                    Select
                  </Button>
                </div>
              ))}

              {filtered.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                  No foods match your search.
                </div>
              ) : null}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
