import { redirect } from "next/navigation"

import {
  clientHasActiveCoach,
  getAuthenticatedProfile,
} from "@formfit/shared/supabase/auth"

export const instant = false

export default async function HomePage() {
  const session = await getAuthenticatedProfile()

  if (!session) {
    redirect("/login")
  }

  if (session.profile.role !== "client") {
    redirect("/login?error=client_required")
  }

  const hasCoach = await clientHasActiveCoach(session.user.id)
  if (!hasCoach) {
    redirect("/login?error=no_coach")
  }

  redirect(`/${session.user.id}`)
}
