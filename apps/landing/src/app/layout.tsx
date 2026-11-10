import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const siteUrl =
  process.env.NEXT_PUBLIC_LANDING_APP_URL?.replace(/\/$/, "") ||
  "http://localhost:3002"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "FormFit — Coaching business, one place",
    template: "%s | FormFit",
  },
  description:
    "Plan workouts, manage nutrition, track client progress, and grow your coaching business — without juggling spreadsheets and WhatsApp.",
  applicationName: "FormFit",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "FormFit",
    title: "FormFit — Your coaching business. One place.",
    description:
      "Coach-first fitness management: clients, workouts, nutrition, and progress in one calm workspace.",
  },
  twitter: {
    card: "summary_large_image",
    title: "FormFit — Your coaching business. One place.",
    description:
      "Plan workouts, manage nutrition, and track client progress without spreadsheets and WhatsApp.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}
