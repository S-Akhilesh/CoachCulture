import { initialClients } from "./clients-data"

/**
 * Demo / mock-client portal access is for local development only.
 * Production builds (`NODE_ENV === "production"`) never enable demo mode,
 * even if ALLOW_DEMO_PORTAL is set — set NODE_ENV appropriately for staging.
 */
export function isDemoModeEnabled(): boolean {
  return process.env.NODE_ENV !== "production"
}

export function getMockClientIds(): string[] {
  return initialClients.map((client) => client.id)
}

export function isMockClientId(clientId: string): boolean {
  return initialClients.some((client) => client.id === clientId)
}
