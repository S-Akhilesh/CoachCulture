import { NextResponse } from "next/server"

import {
  COACH_AUTH_REDIRECTS,
  safeAuthRedirectPath,
} from "@formfit/shared/supabase/safe-redirect"
import { createClient } from "@formfit/shared/supabase/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = safeAuthRedirectPath(
    searchParams.get("next"),
    COACH_AUTH_REDIRECTS,
    "/"
  )
  const errorDescription = searchParams.get("error_description")
  const errorCode = searchParams.get("error")

  if (errorCode || errorDescription) {
    const params = new URLSearchParams({ error: "session" })
    if (errorDescription?.toLowerCase().includes("expired")) {
      params.set("error", "link_expired")
    }
    return NextResponse.redirect(`${origin}/login?${params.toString()}`)
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }

    const params = new URLSearchParams({ error: "session" })
    if (error.message.toLowerCase().includes("expired")) {
      params.set("error", "link_expired")
    }
    return NextResponse.redirect(`${origin}/login?${params.toString()}`)
  }

  return NextResponse.redirect(`${origin}/login?error=session`)
}
