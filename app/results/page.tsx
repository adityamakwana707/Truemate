"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { Header } from "@/components/header"
import { ResultCard } from "@/components/result-card"
import { EvidenceList } from "@/components/evidence-list"
import { SourceCredibilityBadge } from "@/components/source-credibility-badge"
import { HarmIndexIndicator } from "@/components/harm-index-indicator"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Share2, Download, ArrowLeft, Bookmark, Flag, Loader2 } from "lucide-react"
import useSWR from "swr"
import Link from "next/link"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function ResultsContent() {
  const searchParams = useSearchParams()
  const claim = searchParams?.get("claim") || ""

  // Mock data for frontend-only version
  const mockResult = {
    claim: claim,
    verdict: "unknown" as const,
    confidence: 75,
    explanation: "This claim requires connection to an external fact-checking backend service for verification.",
    reasoning: "This is a frontend-only demo. Connect to your backend API for real fact-checking.",
    sourceCredibility: 80,
    harmIndex: "low" as const,
    evidence: [
      {
        title: "Frontend Demo",
        link: "#",
        snippet: "This is a frontend-only demo. Connect to your backend API for real fact-checking.",
        credibility: 0.8,
        relevance: 0.9,
        summary: "Demo evidence item"
      }
    ]
  }

  const data = claim ? mockResult : null
  const error = null
  const isLoading = false

  if (!claim) {
    return (
      <Card className="text-center py-16">
        <CardContent>
          <p className="text-muted-foreground mb-4">No claim provided</p>
          <Link href="/dashboard">
            <Button variant="outline" className="gap-2 bg-transparent">
              <ArrowLeft className="w-4 h-4" />
              Go to Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card className="text-center py-16">
        <CardContent className="space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          <div>
            <p className="font-medium">Analyzing claim...</p>
            <p className="text-sm text-muted-foreground">Cross-referencing sources and evaluating credibility</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="text-center py-16">
        <CardContent>
          <p className="text-destructive mb-4">Error verifying claim. Please try again.</p>
          <Link href="/dashboard">
            <Button variant="outline">Try Again</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  const handleGenerateTruthCard = async () => {
    const response = await fetch("/api/truth-card", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claim: data?.claim, verdict: data?.verdict }),
    })
    const result = await response.json()
    alert(result.message)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            New Search
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <Bookmark className="w-4 h-4" />
            Save
          </Button>
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <Flag className="w-4 h-4" />
            Report
          </Button>
        </div>
      </div>

      <ResultCard
        claim={data?.claim || ""}
        verdict={data?.verdict || "unknown"}
        confidence={data?.confidence || 0}
        explanation={data?.explanation || ""}
      />

      <div className="flex items-center justify-between mb-6">
        <SourceCredibilityBadge score={data?.sourceCredibility || 0} />
        <HarmIndexIndicator level={data?.harmIndex || "low"} />
      </div>

      <EvidenceList evidence={data?.evidence || []} />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Share Results</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleGenerateTruthCard} className="gap-2 bg-transparent">
            <Download className="w-4 h-4" />
            Download Truth Card
          </Button>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Share2 className="w-4 h-4" />
            Share Link
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ResultsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Suspense
          fallback={
            <Card className="text-center py-16">
              <CardContent>
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
              </CardContent>
            </Card>
          }
        >
          <ResultsContent />
        </Suspense>
      </main>
    </div>
  )
}
