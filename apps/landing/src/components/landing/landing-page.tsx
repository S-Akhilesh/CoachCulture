import {
  Apple,
  ArrowRight,
  ClipboardList,
  Dumbbell,
  LineChart,
  MessageSquareWarning,
  NotebookPen,
  ShieldCheck,
  Users,
} from "lucide-react"

import { Button } from "@formfit/ui/button"
import { Separator } from "@formfit/ui/separator"

import { BrandMark } from "@/components/brand-mark"
import { ProductFrame } from "@/components/landing/product-frame"
import { SiteHeader } from "@/components/landing/site-header"

const problems = [
  {
    icon: NotebookPen,
    title: "Clients in spreadsheets",
    body: "Rosters, notes, and check-ins scattered across tabs you never meant to maintain.",
  },
  {
    icon: MessageSquareWarning,
    title: "Workouts over WhatsApp",
    body: "Plans get lost in chat threads. Clients ask for the same file again and again.",
  },
  {
    icon: Apple,
    title: "Diet plans by hand",
    body: "Building meals one by one, then rewriting them when a client’s goals change.",
  },
  {
    icon: LineChart,
    title: "Progress across tools",
    body: "Weights, photos, and measurements live in different apps — if they get logged at all.",
  },
]

const coachFeatures = [
  {
    icon: Users,
    title: "Client management",
    body: "Invite clients, keep profiles organized, and open their portal when you need context.",
  },
  {
    icon: Dumbbell,
    title: "Workout plan builder",
    body: "Structure days and exercises, then assign plans without copy-pasting into chat.",
  },
  {
    icon: ClipboardList,
    title: "Exercise library",
    body: "Reuse your own exercise catalog when you build the next program.",
  },
  {
    icon: Apple,
    title: "Diet plan builder",
    body: "Compose meals from your food library and assign nutrition alongside training.",
  },
  {
    icon: ShieldCheck,
    title: "Client assignments",
    body: "Publish plans and assign the latest revision so clients see a clear program.",
  },
  {
    icon: LineChart,
    title: "Progress overview",
    body: "Review what clients log so coaching decisions stay grounded in their data.",
  },
]

const clientFeatures = [
  {
    title: "Assigned workouts",
    body: "See the plan your coach assigned — not a forwarded screenshot.",
  },
  {
    title: "Workout tracking",
    body: "Log sets as you train and keep a history of completed sessions.",
  },
  {
    title: "Meal logging",
    body: "Check off meals against the nutrition plan your coach built.",
  },
  {
    title: "Nutrition tracking",
    body: "Stay aligned with the prescribed meals without a separate food app.",
  },
  {
    title: "Body measurements",
    body: "Record measurements so progress isn’t only a number on the scale.",
  },
  {
    title: "Progress history",
    body: "Look back at sessions and entries in one calm client portal.",
  },
]

const steps = [
  {
    step: "01",
    title: "Add your clients",
    body: "Invite clients by email. They create an account and join your coaching relationship securely.",
  },
  {
    step: "02",
    title: "Build and assign plans",
    body: "Create workout and nutrition plans in the coach studio, then assign them to the right people.",
  },
  {
    step: "03",
    title: "Track progress with clarity",
    body: "Clients log workouts, meals, and measurements. You coach from a single source of truth.",
  },
]

const benefits = [
  "Spend less time managing spreadsheets and chat threads.",
  "Keep workout and nutrition plans organized in one studio.",
  "Understand client progress without chasing updates.",
  "Deliver a more professional coaching experience.",
]

const faqs = [
  {
    q: "What is FormFit?",
    a: "FormFit is a coach-first fitness platform for managing clients, building workout and diet plans, assigning programs, and tracking progress in one place.",
  },
  {
    q: "Is FormFit designed for independent coaches?",
    a: "Yes. FormFit is built around the independent coach workflow — your roster, your plans, and your clients’ day-to-day execution.",
  },
  {
    q: "Can clients track their workouts?",
    a: "Yes. Clients open their portal to view assigned workouts and log sessions as they train.",
  },
  {
    q: "Can coaches assign nutrition plans?",
    a: "Yes. Coaches build diet plans and assign them to clients alongside training programs.",
  },
  {
    q: "Can clients log meals?",
    a: "Yes. Clients can log meals against the nutrition plan their coach assigned.",
  },
  {
    q: "Can I manage multiple clients?",
    a: "Yes. The coach studio is built to manage a roster of clients and their assigned plans.",
  },
  {
    q: "How do I get started?",
    a: "Create a coach account from Get Started. After you’re set up, invite clients and begin building plans.",
  },
]

export function LandingPage({
  signupUrl,
  loginUrl,
  clientLoginUrl,
}: {
  signupUrl: string
  loginUrl: string
  clientLoginUrl: string
}) {
  return (
    <div id="top" className="min-h-svh bg-background">
      <SiteHeader signupUrl={signupUrl} loginUrl={loginUrl} />

      <main>
        {/* Hero — one composition: brand, headline, support, CTAs, product visual */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_oklch(0.96_0.03_155),_transparent_55%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-primary/10 to-transparent" />

          <div className="relative mx-auto grid max-w-6xl gap-12 px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-end lg:gap-10 lg:px-8 lg:pb-24">
            <div className="landing-fade-up max-w-xl">
              <BrandMark className="mb-8" />
              <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
                Your coaching business. One place.
              </h1>
              <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
                Plan workouts, manage nutrition, track client progress and grow
                your coaching business — without juggling spreadsheets and
                WhatsApp.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  nativeButton={false}
                  className="h-11 px-5 text-sm"
                  render={<a href={signupUrl} />}
                >
                  Get Started
                  <ArrowRight data-icon="inline-end" />
                </Button>
                <Button
                  nativeButton={false}
                  variant="outline"
                  className="h-11 px-5 text-sm"
                  render={<a href="#product" />}
                >
                  Explore the platform
                </Button>
              </div>
            </div>

            <div className="landing-soft-rise">
              <ProductFrame variant="coach" />
            </div>
          </div>
        </section>

        {/* Problem */}
        <section
          id="product"
          className="border-t border-border bg-muted/35 py-20 sm:py-24"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-medium tracking-wide text-primary">
                The problem
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Coaching shouldn&apos;t live in five tabs and a chat thread.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Independent coaches lose hours to administrative drag. FormFit
                replaces the patchwork with one calm workspace.
              </p>
            </div>

            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {problems.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.title} className="space-y-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-5" aria-hidden />
                    </div>
                    <h3 className="text-base font-semibold tracking-tight">
                      {item.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {item.body}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-medium tracking-wide text-primary">
                Features
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Built for coaches. Clear for clients.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Everything below ships in the FormFit coach studio and client
                portal today — no invented capabilities.
              </p>
            </div>

            <div className="mt-14 grid gap-16 lg:grid-cols-2">
              <div>
                <h3 className="text-xl font-semibold tracking-tight">
                  Coach studio
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your operating system for clients, plans, and assignments.
                </p>
                <ul className="mt-8 space-y-6">
                  {coachFeatures.map((feature) => {
                    const Icon = feature.icon
                    return (
                      <li key={feature.title} className="flex gap-4">
                        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                          <Icon className="size-4" aria-hidden />
                        </div>
                        <div>
                          <p className="font-medium">{feature.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {feature.body}
                          </p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold tracking-tight">
                  Client portal
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  A focused space for execution — workouts, meals, and progress.
                </p>
                <ul className="mt-8 space-y-5">
                  {clientFeatures.map((feature) => (
                    <li
                      key={feature.title}
                      className="border-b border-border/80 pb-5 last:border-0 last:pb-0"
                    >
                      <p className="font-medium">{feature.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {feature.body}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Product showcase */}
        <section className="border-y border-border bg-muted/30 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-medium tracking-wide text-primary">
                Product
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                The same studio your coaches and clients already open.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Previews mirror the real FormFit interfaces — dashboard, builders,
                and the client portal — without fabricated dashboards.
              </p>
            </div>

            <div className="mt-14 grid gap-8 lg:grid-cols-2">
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">
                  Workout builder
                </p>
                <ProductFrame variant="workout" />
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">
                  Diet plan builder
                </p>
                <ProductFrame variant="diet" />
              </div>
              <div className="space-y-3 lg:col-span-2 lg:mx-auto lg:w-full lg:max-w-3xl">
                <p className="text-sm font-medium text-muted-foreground">
                  Client workout & progress
                </p>
                <ProductFrame variant="client" />
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-medium tracking-wide text-primary">
                How it works
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Three steps from invite to clarity.
              </h2>
            </div>

            <ol className="mt-14 grid gap-10 sm:grid-cols-3">
              {steps.map((item) => (
                <li key={item.step} className="relative">
                  <p className="text-sm font-semibold tracking-widest text-primary/70">
                    {item.step}
                  </p>
                  <h3 className="mt-3 text-lg font-semibold tracking-tight">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* For coaches */}
        <section
          id="for-coaches"
          className="border-t border-border bg-[radial-gradient(ellipse_at_top_left,_oklch(0.97_0.02_155),_transparent_50%)] py-20 sm:py-24"
        >
          <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:px-8">
            <div>
              <p className="text-sm font-medium tracking-wide text-primary">
                For coaches
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                More coaching. Less admin.
              </h2>
              <ul className="mt-8 space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex gap-3 text-sm sm:text-base">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                    <span className="text-foreground/90">{benefit}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-10">
                <Button
                  nativeButton={false}
                  className="h-11 px-5"
                  render={<a href={signupUrl} />}
                >
                  Get Started
                </Button>
              </div>
            </div>
            <ProductFrame variant="coach" />
          </div>
        </section>

        {/* Pricing — honest placeholder */}
        <section id="pricing" className="py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-medium tracking-wide text-primary">
                Pricing
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Pricing coming soon
              </h2>
              <p className="mt-4 text-muted-foreground">
                FormFit is in active development. Billing is not live yet. Join
                as a coach to explore the product while we finalize plans.
              </p>
            </div>

            <div className="mx-auto mt-12 max-w-md rounded-2xl border border-border bg-card px-6 py-8 text-center shadow-sm">
              <p className="text-sm font-medium text-primary">Early access</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">
                Coach beta
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Create a coach account, invite clients, and use the studio and
                portal. No payment required at this stage.
              </p>
              <Button
                nativeButton={false}
                className="mt-6 h-11 w-full sm:w-auto sm:px-6"
                render={<a href={signupUrl} />}
              >
                Get Started
              </Button>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-border bg-muted/30 py-20 sm:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
              Frequently asked questions
            </h2>
            <div className="mt-12 space-y-0">
              {faqs.map((item, index) => (
                <div key={item.q}>
                  {index > 0 ? <Separator /> : null}
                  <details className="group py-5">
                    <summary className="cursor-pointer list-none text-base font-medium tracking-tight outline-none marker:content-none focus-visible:ring-2 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
                      <span className="flex items-start justify-between gap-4">
                        {item.q}
                        <span className="mt-0.5 text-muted-foreground transition group-open:rotate-45">
                          +
                        </span>
                      </span>
                    </summary>
                    <p className="mt-3 pr-8 text-sm leading-relaxed text-muted-foreground">
                      {item.a}
                    </p>
                  </details>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl border border-border bg-[radial-gradient(ellipse_at_top,_oklch(0.94_0.04_155),_oklch(0.99_0.002_155)_70%)] px-6 py-14 text-center sm:px-12">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Spend less time managing. More time coaching.
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
                Start with the coach studio. Invite clients when you&apos;re ready.
              </p>
              <Button
                nativeButton={false}
                className="mt-8 h-11 px-6"
                render={<a href={signupUrl} />}
              >
                Get Started
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-muted/20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.2fr_repeat(3,1fr)] lg:px-8">
          <div>
            <BrandMark />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Coach-first fitness management for independent trainers and their
              clients.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold">Product</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#features" className="hover:text-foreground">
                  Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-foreground">
                  How it works
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-foreground">
                  Pricing
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold">Portals</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                <a href={loginUrl} className="hover:text-foreground">
                  Coach Portal
                </a>
              </li>
              <li>
                <a href={clientLoginUrl} className="hover:text-foreground">
                  Client Portal
                </a>
              </li>
              <li>
                <a href={signupUrl} className="hover:text-foreground">
                  Coach signup
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold">Company</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                <span className="cursor-default" title="Coming soon">
                  Contact{" "}
                  <span className="text-xs text-muted-foreground/80">
                    (soon)
                  </span>
                </span>
              </li>
              <li>
                <span className="cursor-default" title="Coming soon">
                  Privacy Policy{" "}
                  <span className="text-xs text-muted-foreground/80">
                    (soon)
                  </span>
                </span>
              </li>
              <li>
                <span className="cursor-default" title="Coming soon">
                  Terms of Service{" "}
                  <span className="text-xs text-muted-foreground/80">
                    (soon)
                  </span>
                </span>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border">
          <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-muted-foreground sm:px-6 lg:px-8">
            © 2026 FormFit. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
