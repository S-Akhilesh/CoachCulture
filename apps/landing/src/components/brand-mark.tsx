import { Activity } from "lucide-react"
import { cn } from "cn"

export function BrandMark({
  className,
  showWordmark = true,
}: {
  className?: string
  showWordmark?: boolean
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <Activity className="size-4" strokeWidth={2.5} aria-hidden />
      </span>
      {showWordmark ? (
        <span className="text-base font-semibold tracking-tight">FormFit</span>
      ) : null}
    </span>
  )
}
