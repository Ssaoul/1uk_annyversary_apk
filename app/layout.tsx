import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "기념일 관리",
  description: "소중한 사람들의 기념일을 체계적으로 관리하고 알림을 받아보세요",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "기념일 관리",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "기념일 관리",
    title: "기념일 관리",
    description: "소중한 사람들의 기념일을 체계적으로 관리하고 알림을 받아보세요",
  },
  twitter: {
    card: "summary",
    title: "기념일 관리",
    description: "소중한 사람들의 기념일을 체계적으로 관리하고 알림을 받아보세요",
  },
    generator: 'v0.dev'
}

export const viewport: Viewport = {
  themeColor: "#3F51B5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="기념일 관리" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#3F51B5" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
