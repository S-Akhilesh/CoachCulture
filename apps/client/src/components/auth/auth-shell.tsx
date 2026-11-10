import { Activity } from "lucide-react"

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-svh items-center justify-center bg-[radial-gradient(ellipse_at_top,_oklch(0.96_0.03_155),_oklch(0.99_0.002_155)_60%)] px-4 py-10">
      <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-primary/15 to-transparent" />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Activity className="size-5" strokeWidth={2.5} />
          </div>
          <p className="text-sm font-medium tracking-wide text-primary">FormFit</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="rounded-2xl border border-border/80 bg-card/95 p-6 shadow-sm backdrop-blur">
          {children}
        </div>
      </div>
    </div>
  )
}
