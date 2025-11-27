import type React from "react"
import type { Metadata } from "next"

import "./globals.css"

import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-provider"

import { Geist_Mono, Geist_Mono as V0_Font_Geist_Mono } from 'next/font/google'

// Initialize fonts
const _geistMono = V0_Font_Geist_Mono({ subsets: ['latin'], weight: ["100","200","300","400","500","600","700","800","900"] })

const geistMono = Geist_Mono({ subsets: ["latin"], weight: ["400", "500", "600", "700"] })

export const metadata: Metadata = {
  title: "TruthMate - AI-Powered Fact Verification",
  description: "Verify claims, URLs, and images using AI-powered fact-checking and analysis.",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={geistMono.className}>
        <AuthProvider>
          <ThemeProvider defaultTheme="system" storageKey="truthmate-theme">
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
