import { WorkoutsProvider } from "@/components/workouts/workouts-context"

export default function WorkoutsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <WorkoutsProvider>{children}</WorkoutsProvider>
}
