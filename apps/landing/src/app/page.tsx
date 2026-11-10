import { LandingPage } from "@/components/landing/landing-page"
import {
  getClientLoginUrl,
  getCoachLoginUrl,
  getCoachSignupUrl,
} from "@/lib/app-urls"

export default function HomePage() {
  return (
    <LandingPage
      signupUrl={getCoachSignupUrl()}
      loginUrl={getCoachLoginUrl()}
      clientLoginUrl={getClientLoginUrl()}
    />
  )
}
