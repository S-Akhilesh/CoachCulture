import { redirect } from "next/navigation"

import { isDemoModeEnabled } from "@formfit/shared/demo-mode"

import { ClientPickerPage } from "@/components/client-picker-page"

export const instant = false

export default function DemoPickerPage() {
  if (!isDemoModeEnabled()) {
    redirect("/login")
  }

  return <ClientPickerPage />
}
