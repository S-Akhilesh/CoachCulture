"use client"

import { MoreHorizontal, Search, Users } from "lucide-react"

import { ClientStatusBadge } from "@/components/clients/client-status-badge"
import { Avatar, AvatarFallback } from "@formfit/ui/avatar"
import { Button } from "@formfit/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@formfit/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@formfit/ui/dropdown-menu"
import { Input } from "@formfit/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@formfit/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@formfit/ui/table"
import {
  type Client,
  type ClientStatus,
  formatDisplayDate,
  getInitials,
} from "@formfit/shared/clients-data"

export type StatusFilter = "all" | ClientStatus

type ClientsTableProps = {
  clients: Client[]
  search: string
  statusFilter: StatusFilter
  onSearchChange: (value: string) => void
  onStatusFilterChange: (value: StatusFilter) => void
  onView: (client: Client) => void
  onEdit: (client: Client) => void
}

export function ClientsTable({
  clients,
  search,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
  onView,
  onEdit,
}: ClientsTableProps) {
  return (
    <Card className="shadow-none">
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>Client list</CardTitle>
            <CardDescription>
              Search, filter, and manage your coaching roster
            </CardDescription>
          </div>
          <p className="text-sm text-muted-foreground">
            {clients.length} {clients.length === 1 ? "result" : "results"}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search by name or email..."
              className="h-9 bg-muted/40 pl-8"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              if (value === "all" || value === "active" || value === "inactive") {
                onStatusFilterChange(value)
              }
            }}
          >
            <SelectTrigger className="h-9 w-full bg-muted/40 sm:w-40">
              <SelectValue
                placeholder="All statuses"
              >
                {statusFilter === "all"
                  ? "All statuses"
                  : statusFilter === "active"
                    ? "Active"
                    : "Inactive"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border px-6 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Users className="size-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">No clients found</p>
              <p className="text-sm text-muted-foreground">
                Try a different search term or status filter.
              </p>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden lg:table-cell">
                  Fitness goal
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Join date</TableHead>
                <TableHead className="w-12 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar size="sm">
                        <AvatarFallback className="bg-primary/15 text-primary">
                          {getInitials(client.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{client.fullName}</p>
                        <p className="truncate text-xs text-muted-foreground md:hidden">
                          {client.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-muted-foreground">{client.email}</span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {client.fitnessGoal}
                  </TableCell>
                  <TableCell>
                    <ClientStatusBadge status={client.status} />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {formatDisplayDate(client.startDate)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                        aria-label={`Actions for ${client.fullName}`}
                      >
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView(client)}>
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(client)}>
                          Edit
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
