"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Shield, Menu, X, Search, History, Compass, Users, Bookmark, Settings, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { ThemeToggle } from "@/components/theme-toggle"

const navItems = [
  { href: "/dashboard", label: "Verify", icon: Search },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/community", label: "Community", icon: Users },
  { href: "/history", label: "History", icon: History },
  { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function Header() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5 font-bold">
          <div className="w-7 h-7 bg-foreground text-background flex items-center justify-center">
            <Shield className="w-3.5 h-3.5" />
          </div>
          <span className="hidden sm:inline">TruthMate</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:text-foreground",
                pathname === item.href ? "text-foreground font-medium bg-muted" : "text-muted-foreground",
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login" className="hidden lg:block">
            <Button variant="ghost" size="sm" className="gap-2">
              <User className="w-4 h-4" />
              Login
            </Button>
          </Link>

          {/* Mobile Menu Button */}
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t bg-background">
          <nav className="container mx-auto px-4 py-3 flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-sm transition-colors",
                  pathname === item.href
                    ? "bg-muted font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
            <hr className="my-2" />
            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-3">
                <User className="w-4 h-4" />
                Login
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
