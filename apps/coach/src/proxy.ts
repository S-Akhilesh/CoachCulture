import { type NextRequest } from "next/server"

import { updateSession } from "@formfit/shared/supabase/update-session"

/**
 * Next.js 16 session refresh proxy.
 * Refreshes Supabase auth cookies without changing route behavior.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets and images.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
