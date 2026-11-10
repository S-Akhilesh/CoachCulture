export function getCoachAppUrl() {
  return (
    process.env.NEXT_PUBLIC_COACH_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  )
}
