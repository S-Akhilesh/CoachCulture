import { WorkoutSessionView } from "@/components/workout-session-view"

export const instant = false

export default async function PortalWorkoutSessionPage({
  params,
}: {
  params: Promise<{ dayId: string }>
}) {
  const { dayId } = await params
  return <WorkoutSessionView dayId={dayId} />
}
