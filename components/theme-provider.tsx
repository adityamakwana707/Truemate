"use client"
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps, useTheme } from "next-themes"

export { useTheme }

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
