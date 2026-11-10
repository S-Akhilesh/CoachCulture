export function getClientAppUrl() {
  return (
    process.env.NEXT_PUBLIC_CLIENT_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3001"
  )
}

export function getClientPortalUrl(clientId: string) {
  return `${getClientAppUrl()}/${clientId}`
}
