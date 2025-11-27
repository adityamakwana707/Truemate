import { ClaimInputCard } from "@/components/claim-input-card"
import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Clock, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"

const trendingClaims = [
  { claim: "New vaccine has 95% efficacy rate", verdict: "true" },
  { claim: "Solar energy is now cheaper than coal", verdict: "true" },
  { claim: "AI will replace 50% of jobs by 2030", verdict: "misleading" },
]

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Verify Any Claim</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Submit a claim, URL, or image to check its accuracy using AI-powered analysis.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main input card */}
          <div className="lg:col-span-2">
            <ClaimInputCard />
          </div>

          <div className="space-y-6">
            {/* Quick stats */}
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Your Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Verifications today</span>
                    <span className="font-medium">3</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total verified</span>
                    <span className="font-medium">127</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Saved claims</span>
                    <span className="font-medium">24</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trending claims */}
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Trending Now
                </h3>
                <div className="space-y-3">
                  {trendingClaims.map((item, i) => (
                    <Link
                      key={i}
                      href={`/results?claim=${encodeURIComponent(item.claim)}`}
                      className="block p-3 border hover:bg-muted/50 transition-colors"
                    >
                      <p className="text-sm font-medium line-clamp-2 mb-2">{item.claim}</p>
                      <Badge
                        variant="outline"
                        className={
                          item.verdict === "true"
                            ? "bg-green-500/10 text-green-600 border-green-500/20"
                            : item.verdict === "false"
                              ? "bg-red-500/10 text-red-600 border-red-500/20"
                              : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                        }
                      >
                        {item.verdict === "true" && <CheckCircle className="w-3 h-3 mr-1" />}
                        {item.verdict === "false" && <XCircle className="w-3 h-3 mr-1" />}
                        {item.verdict.charAt(0).toUpperCase() + item.verdict.slice(1)}
                      </Badge>
                    </Link>
                  ))}
                </div>
                <Link
                  href="/explore"
                  className="block text-center text-sm text-muted-foreground hover:text-foreground mt-4"
                >
                  View all trending claims
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
