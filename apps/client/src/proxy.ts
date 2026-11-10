import { NextResponse, type NextRequest } from "next/server"

import { isMockClientId } from "@formfit/shared/demo-mode"
import { updateSession } from "@formfit/shared/supabase/update-session"

/**
 * Next.js 16 session refresh proxy.
 * Also blocks demo/mock portal routes in production builds.
 */
export async function proxy(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    const { pathname } = request.nextUrl
    if (pathname === "/demo" || pathname.startsWith("/demo/")) {
      const login = request.nextUrl.clone()
      login.pathname = "/login"
      login.search = ""
      return NextResponse.redirect(login)
    }

    const firstSegment = pathname.split("/").filter(Boolean)[0]
    if (firstSegment && isMockClientId(firstSegment)) {
      const login = request.nextUrl.clone()
      login.pathname = "/login"
      login.search = ""
      return NextResponse.redirect(login)
    }
  }

  return updateSession(request)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
