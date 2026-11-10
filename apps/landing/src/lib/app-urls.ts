function trimOrigin(value: string | undefined, fallback: string) {
  return value?.replace(/\/$/, "") || fallback
}

export function getCoachAppUrl() {
  return trimOrigin(process.env.NEXT_PUBLIC_COACH_APP_URL, "http://localhost:3000")
}

export function getClientAppUrl() {
  return trimOrigin(process.env.NEXT_PUBLIC_CLIENT_APP_URL, "http://localhost:3001")
}

/** Coach signup — actual route in apps/coach */
export function getCoachSignupUrl() {
  return `${getCoachAppUrl()}/signup`
}

/** Coach login — actual route in apps/coach */
export function getCoachLoginUrl() {
  return `${getCoachAppUrl()}/login`
}

/** Client login — actual route in apps/client */
export function getClientLoginUrl() {
  return `${getClientAppUrl()}/login`
}
