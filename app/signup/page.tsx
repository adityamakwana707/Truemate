"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Shield, ArrowLeft, Mail, Lock, User, Loader2, CheckCircle } from "lucide-react"

export default function SignupPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (session) {
      router.push('/dashboard')
    }
  }, [session, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!agreedToTerms) {
      setError("Please agree to the terms and conditions")
      setIsLoading(false)
      return
    }

    if (!name || !email || !password) {
      setError("Please fill in all fields")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setIsLoading(false)
      return
    }

    try {
      // Register user
      const registerResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })

      const registerData = await registerResponse.json()

      if (!registerResponse.ok) {
        setError(registerData.error || 'Registration failed')
        return
      }

      // Auto-login after successful registration
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      })

      if (result?.error) {
        setError('Registration successful, but login failed. Please try logging in.')
        router.push('/login')
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:w-1/2 bg-foreground text-background p-12 flex-col justify-between">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-lg">
          <div className="w-8 h-8 bg-background text-foreground flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
          TruthMate
        </Link>
        <div className="space-y-8">
          <h2 className="text-3xl font-bold">Start verifying claims in seconds</h2>
          <div className="space-y-4">
            {[
              "Unlimited fact-checks for personal use",
              "Access to community discussions",
              "Save and bookmark claims",
              "Privacy controls for your searches",
              "API access for developers",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-sm opacity-50">Join 500,000+ fact-checkers worldwide</p>
      </div>

      {/* Right panel with form */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <header className="lg:hidden border-b">
          <div className="px-4 h-16 flex items-center">
            <Link href="/" className="flex items-center gap-2 font-bold">
              <div className="w-7 h-7 bg-foreground text-background flex items-center justify-center">
                <Shield className="w-3.5 h-3.5" />
              </div>
              TruthMate
            </Link>
          </div>
        </header>

        {/* Form */}
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-2">Create your account</h1>
              <p className="text-muted-foreground">Start verifying claims with TruthMate</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm bg-destructive/10 text-destructive border border-destructive/20">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
              </div>
              <div className="flex items-start gap-3 py-2">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                  className="mt-0.5"
                />
                <Label htmlFor="terms" className="text-sm font-normal leading-relaxed">
                  I agree to the{" "}
                  <Link href="#" className="underline hover:text-foreground">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link href="#" className="underline hover:text-foreground">
                    Privacy Policy
                  </Link>
                </Label>
              </div>
              <Button type="submit" className="w-full h-11" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
            </form>

            <div className="mt-8 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link href="/login" className="font-medium hover:underline">
                Sign in
              </Link>
            </div>

            <Link
              href="/"
              className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Link>
          </div>
        </main>
      </div>
    </div>
  )
}
