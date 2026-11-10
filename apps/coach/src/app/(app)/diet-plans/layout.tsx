import { DietPlansProvider } from "@/components/diet-plans/diet-plans-context"

export default function DietPlansLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DietPlansProvider>{children}</DietPlansProvider>
}
