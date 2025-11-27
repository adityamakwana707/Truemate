"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Shield,
  CheckCircle,
  Search,
  Zap,
  BarChart3,
  Users,
  ArrowRight,
  Moon,
  Sun,
  Globe,
  Lock,
  Sparkles,
  TrendingUp,
  Clock,
  Award,
} from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { Badge } from "@/components/ui/badge"

export default function LandingPage() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-lg">
            <div className="w-8 h-8 bg-foreground text-background flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            TruthMate
          </Link>
          <nav className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            <Link href="/login">
              <Button variant="ghost" className="hidden sm:inline-flex">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge variant="outline" className="mb-6 py-1.5 px-4 text-sm font-medium gap-2">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Fact Verification
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-balance leading-[1.1]">
            Truth in seconds,
            <br />
            <span className="text-muted-foreground">not hours</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-pretty leading-relaxed">
            Instantly verify any claim using AI. Cross-reference multiple sources, analyze credibility, and get
            evidence-based verdicts.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base gap-2">
                Start Verifying Free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/explore">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 text-base bg-transparent">
                Explore Claims
              </Button>
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Free to use
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Privacy-first
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              50+ languages
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 border-y bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <div className="bg-background border shadow-lg p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <span className="text-sm text-muted-foreground">TruthMate Verification</span>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 border">
                <p className="text-sm text-muted-foreground mb-2">Claim submitted:</p>
                <p className="font-medium">&quot;Coffee reduces the risk of heart disease by 30%&quot;</p>
              </div>
              <div className="flex items-center gap-4">
                <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/20">
                  Misleading
                </Badge>
                <span className="text-sm text-muted-foreground">Confidence: 87%</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                While some studies suggest moderate coffee consumption may have cardiovascular benefits, the claim of
                &quot;30% reduction&quot; overstates the evidence. Meta-analyses show a more modest 10-15% association,
                and correlation does not imply causation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How it works</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">Three simple steps to verify any claim</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="group p-8 border bg-background hover:border-foreground/20 transition-colors relative">
              <div className="absolute top-6 right-6 text-5xl font-bold text-muted/30">1</div>
              <div className="w-14 h-14 bg-foreground text-background flex items-center justify-center mb-6">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-xl mb-3">Submit</h3>
              <p className="text-muted-foreground leading-relaxed">
                Enter text, paste a URL, or upload an image containing the claim you want to verify.
              </p>
            </div>
            <div className="group p-8 border bg-background hover:border-foreground/20 transition-colors relative">
              <div className="absolute top-6 right-6 text-5xl font-bold text-muted/30">2</div>
              <div className="w-14 h-14 bg-foreground text-background flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-xl mb-3">Analyze</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our AI cross-references multiple authoritative sources and evaluates source credibility.
              </p>
            </div>
            <div className="group p-8 border bg-background hover:border-foreground/20 transition-colors relative">
              <div className="absolute top-6 right-6 text-5xl font-bold text-muted/30">3</div>
              <div className="w-14 h-14 bg-foreground text-background flex items-center justify-center mb-6">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-xl mb-3">Verify</h3>
              <p className="text-muted-foreground leading-relaxed">
                Get a clear verdict with supporting evidence, confidence scores, and harm assessment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 border-y bg-foreground text-background">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">10M+</div>
              <div className="text-sm opacity-70">Claims Verified</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">95%</div>
              <div className="text-sm opacity-70">Accuracy Rate</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">500K+</div>
              <div className="text-sm opacity-70">Active Users</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">&lt;5s</div>
              <div className="text-sm opacity-70">Avg Response</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for everyone</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">
              Whether you&apos;re a journalist, researcher, or curious citizen
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: TrendingUp, title: "Journalists", desc: "Verify sources before publishing" },
              { icon: Users, title: "Researchers", desc: "Cross-reference academic claims" },
              { icon: Award, title: "Educators", desc: "Teach media literacy skills" },
              { icon: Clock, title: "Everyone", desc: "Stop misinformation spreading" },
            ].map((item) => (
              <div key={item.title} className="p-6 border bg-background hover:border-foreground/20 transition-colors">
                <item.icon className="w-5 h-5 mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 border-t">
        <div className="container mx-auto max-w-2xl text-center">
          <div className="w-16 h-16 bg-foreground text-background flex items-center justify-center mx-auto mb-8">
            <Zap className="w-7 h-7" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">Ready to fight misinformation?</h2>
          <p className="text-muted-foreground mb-10 text-lg">
            Join thousands of fact-checkers. Free forever for personal use.
          </p>
          <Link href="/signup">
            <Button size="lg" className="h-12 px-10 text-base gap-2">
              Create Free Account
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5 font-bold">
            <div className="w-7 h-7 bg-foreground text-background flex items-center justify-center">
              <Shield className="w-3.5 h-3.5" />
            </div>
            TruthMate
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-foreground transition-colors">
              About
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="#" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link href="/community" className="hover:text-foreground transition-colors">
              Community
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">2025 TruthMate</p>
        </div>
      </footer>
    </div>
  )
}
