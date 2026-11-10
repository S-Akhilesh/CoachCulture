"use client"

import { getClientPortalUrl } from "@/lib/app-urls"
import { Apple, Dumbbell, Eye, Mail, Phone } from "lucide-react"

import { ClientStatusBadge } from "@/components/clients/client-status-badge"
import { Avatar, AvatarFallback } from "@formfit/ui/avatar"
import { Button } from "@formfit/ui/button"
import { Separator } from "@formfit/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@formfit/ui/sheet"
import {
  type Client,
  formatDisplayDate,
  getInitials,
} from "@formfit/shared/clients-data"

type ClientDetailSheetProps = {
  client: Client | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (client: Client) => void
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <div className="text-sm text-foreground">{value}</div>
    </div>
  )
}

export function ClientDetailSheet({
  client,
  open,
  onOpenChange,
  onEdit,
}: ClientDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        {client ? (
          <>
            <SheetHeader className="border-b border-border">
              <div className="flex items-start gap-3 pr-8">
                <Avatar size="lg">
                  <AvatarFallback className="bg-primary/15 text-primary">
                    {getInitials(client.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 space-y-1">
                  <SheetTitle className="truncate text-lg">
                    {client.fullName}
                  </SheetTitle>
                  <SheetDescription className="flex flex-wrap items-center gap-2">
                    <ClientStatusBadge status={client.status} />
                    <span>Joined {formatDisplayDate(client.startDate)}</span>
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="flex-1 space-y-6 overflow-y-auto px-4 py-2">
              <section className="space-y-4">
                <h3 className="text-sm font-medium">Contact information</h3>
                <div className="space-y-3 rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="size-4 text-muted-foreground" />
                    <a
                      href={`mailto:${client.email}`}
                      className="truncate hover:underline"
                    >
                      {client.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="size-4 text-muted-foreground" />
                    <span>{client.phone}</span>
                  </div>
                </div>
              </section>

              <section className="grid gap-4 sm:grid-cols-2">
                <DetailRow label="Fitness goal" value={client.fitnessGoal} />
                <DetailRow
                  label="Start date"
                  value={formatDisplayDate(client.startDate)}
                />
              </section>

              <section className="space-y-2">
                <DetailRow
                  label="Notes"
                  value={
                    client.notes ? (
                      <p className="leading-relaxed text-muted-foreground">
                        {client.notes}
                      </p>
                    ) : (
                      <p className="text-muted-foreground">No notes yet.</p>
                    )
                  }
                />
              </section>

              <Separator />

              <section className="space-y-3">
                <h3 className="text-sm font-medium">Assigned plans</h3>
                <div className="space-y-3">
                  <div className="rounded-lg border border-dashed border-border p-3">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <Dumbbell className="size-4 text-primary" />
                      Workout plan
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {client.assignedWorkoutPlan ??
                        "No workout plan assigned yet."}
                    </p>
                  </div>
                  <div className="rounded-lg border border-dashed border-border p-3">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <Apple className="size-4 text-primary" />
                      Diet plan
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {client.assignedDietPlan ?? "No diet plan assigned yet."}
                    </p>
                  </div>
                </div>
              </section>
            </div>

            <SheetFooter className="border-t border-border sm:flex-row sm:justify-between">
              <Button
                nativeButton={false}
                variant="outline"
                render={
                  <a
                    href={getClientPortalUrl(client.id)}
                    target="_blank"
                    rel="noreferrer"
                  />
                }
                onClick={() => onOpenChange(false)}
              >
                <Eye data-icon="inline-start" />
                View as Client
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  onOpenChange(false)
                  onEdit(client)
                }}
              >
                Edit client
              </Button>
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
