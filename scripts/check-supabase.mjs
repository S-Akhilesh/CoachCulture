import { readFileSync } from "node:fs"
import { createBrowserClient } from "@supabase/ssr"

function loadEnv(path) {
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue
    const index = trimmed.indexOf("=")
    const key = trimmed.slice(0, index).trim()
    let value = trimmed.slice(index + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = value
  }
}

function check() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()
  if (!url || !key) {
    return {
      ok: false,
      configured: false,
      message:
        "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    }
  }
  const client = createBrowserClient(url, key)
  return {
    ok: Boolean(client),
    configured: true,
    message: client
      ? "Supabase client initialized successfully."
      : "Supabase client failed to initialize.",
  }
}

loadEnv("apps/coach/.env.local")
console.log("coach-env", check())

delete process.env.NEXT_PUBLIC_SUPABASE_URL
delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
console.log("missing-env", check())
