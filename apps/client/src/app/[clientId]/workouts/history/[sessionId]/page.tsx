import { WorkoutHistoryDetail } from "@/components/workout-history-view"

export const instant = false

export default async function PortalWorkoutHistoryDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  return <WorkoutHistoryDetail sessionId={sessionId} />
}
