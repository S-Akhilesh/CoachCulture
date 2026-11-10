"use client"

import Link from "next/link"

import { initialClients, getInitials } from "@formfit/shared/clients-data"
import { Avatar, AvatarFallback } from "@formfit/ui/avatar"
import { Button } from "@formfit/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@formfit/ui/card"
import { getCoachAppUrl } from "@/lib/app-urls"

export function ClientPickerPage() {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-lg flex-col justify-center gap-6 px-4 py-10">
      <div className="space-y-2 text-center">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          FormFit
        </p>
        <h1 className="text-2xl font-medium tracking-tight">Client Portal</h1>
        <p className="text-sm text-muted-foreground">
          Prototype login is not ready yet. Choose a client to continue.
        </p>
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Select client</CardTitle>
          <CardDescription>
            In production this will be replaced by authentication.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {initialClients.map((client) => (
            <Button
              key={client.id}
              nativeButton={false}
              variant="outline"
              className="h-auto w-full justify-start gap-3 px-3 py-3"
              render={<Link href={`/${client.id}`} />}
            >
              <Avatar size="sm">
                <AvatarFallback className="bg-primary/15 text-primary">
                  {getInitials(client.fullName)}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0 text-left">
                <span className="block truncate font-medium">
                  {client.fullName}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {client.fitnessGoal}
                </span>
              </span>
            </Button>
          ))}
        </CardContent>
      </Card>

      <Button
        nativeButton={false}
        variant="ghost"
        className="mx-auto"
        render={<a href={getCoachAppUrl()} />}
      >
        Back to Coach app
      </Button>
    </div>
  )
}
