import { initialClients } from "./clients-data"

/**
 * Demo / mock-client portal access.
 * Temporarily enabled in all environments for early previews.
 * Set ALLOW_DEMO_PORTAL=false to disable (server/proxy only; prefer redeploying with this off later).
 */
export function isDemoModeEnabled(): boolean {
  return process.env.ALLOW_DEMO_PORTAL !== "false"
}

export function getMockClientIds(): string[] {
  return initialClients.map((client) => client.id)
}

export function isMockClientId(clientId: string): boolean {
  return initialClients.some((client) => client.id === clientId)
}
