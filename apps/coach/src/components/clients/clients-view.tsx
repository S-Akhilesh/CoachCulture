"use client"

import { useMemo, useState } from "react"
import { MailPlus, Plus } from "lucide-react"

import { ClientDetailSheet } from "@/components/clients/client-detail-sheet"
import { ClientFormDialog } from "@/components/clients/client-form-dialog"
import { InviteClientDialog } from "@/components/clients/invite-client-dialog"
import {
  ClientsTable,
  type StatusFilter,
} from "@/components/clients/clients-table"
import { ClientsSummary } from "@/components/clients/clients-summary"
import { usePageHeaderActions } from "@/components/dashboard/page-header-context"
import { Button } from "@formfit/ui/button"
import {
  type Client,
  type ClientFormValues,
  initialClients,
} from "@formfit/shared/clients-data"

export function ClientsView() {
  const [clients, setClients] = useState<Client[]>(initialClients)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [formOpen, setFormOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [viewingClient, setViewingClient] = useState<Client | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const headerActions = useMemo(
    () => (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="h-9"
          onClick={() => setInviteOpen(true)}
        >
          <MailPlus className="size-4" />
          Invite Client
        </Button>
        <Button
          className="h-9"
          onClick={() => {
            setEditingClient(null)
            setFormOpen(true)
          }}
        >
          <Plus className="size-4" />
          Add Client
        </Button>
      </div>
    ),
    []
  )

  usePageHeaderActions(headerActions)

  const filteredClients = useMemo(() => {
    const query = search.trim().toLowerCase()

    return clients.filter((client) => {
      const matchesStatus =
        statusFilter === "all" ? true : client.status === statusFilter
      const matchesSearch =
        query.length === 0 ||
        client.fullName.toLowerCase().includes(query) ||
        client.email.toLowerCase().includes(query)

      return matchesStatus && matchesSearch
    })
  }, [clients, search, statusFilter])

  function handleCreateOrUpdate(values: ClientFormValues) {
    if (editingClient) {
      setClients((current) =>
        current.map((client) =>
          client.id === editingClient.id
            ? {
                ...client,
                ...values,
              }
            : client
        )
      )
      setViewingClient((current) =>
        current?.id === editingClient.id ? { ...current, ...values } : current
      )
      return
    }

    const newClient: Client = {
      id: `c-${crypto.randomUUID()}`,
      ...values,
      assignedWorkoutPlan: null,
      assignedDietPlan: null,
    }

    setClients((current) => [newClient, ...current])
  }

  function openEdit(client: Client) {
    setEditingClient(client)
    setFormOpen(true)
  }

  function openView(client: Client) {
    setViewingClient(client)
    setDetailOpen(true)
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <ClientsSummary clients={clients} />

      <ClientsTable
        clients={filteredClients}
        search={search}
        statusFilter={statusFilter}
        onSearchChange={setSearch}
        onStatusFilterChange={setStatusFilter}
        onView={openView}
        onEdit={openEdit}
      />

      <ClientFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingClient(null)
        }}
        client={editingClient}
        onSubmit={handleCreateOrUpdate}
      />

      <InviteClientDialog open={inviteOpen} onOpenChange={setInviteOpen} />

      <ClientDetailSheet
        client={viewingClient}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open)
          if (!open) setViewingClient(null)
        }}
        onEdit={(client) => {
          setDetailOpen(false)
          openEdit(client)
        }}
      />
    </div>
  )
}
