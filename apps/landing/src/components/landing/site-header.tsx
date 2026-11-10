"use client"

import { useState } from "react"
import { Menu, X } from "lucide-react"

import { Button } from "@formfit/ui/button"

import { BrandMark } from "@/components/brand-mark"

const navLinks = [
  { href: "#product", label: "Product" },
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#for-coaches", label: "For Coaches" },
  { href: "#pricing", label: "Pricing" },
]

export function SiteHeader({
  signupUrl,
  loginUrl,
}: {
  signupUrl: string
  loginUrl: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <a href="#top" className="shrink-0" aria-label="FormFit home">
          <BrandMark />
        </a>

        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Primary"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button
            nativeButton={false}
            variant="ghost"
            className="h-9"
            render={<a href={loginUrl} />}
          >
            Sign in
          </Button>
          <Button
            nativeButton={false}
            className="h-9"
            render={<a href={signupUrl} />}
          >
            Get Started
          </Button>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X /> : <Menu />}
        </Button>
      </div>

      {open ? (
        <div
          id="mobile-nav"
          className="border-t border-border bg-background px-4 py-4 md:hidden"
        >
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2">
            <Button
              nativeButton={false}
              variant="outline"
              className="h-10 w-full"
              render={<a href={loginUrl} />}
            >
              Sign in
            </Button>
            <Button
              nativeButton={false}
              className="h-10 w-full"
              render={<a href={signupUrl} />}
            >
              Get Started
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  )
}
