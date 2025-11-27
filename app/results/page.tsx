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
  const verificationId = searchParams?.get("verificationId") || ""
  const dataParam = searchParams?.get("data") || ""

  // Try to parse data from URL params first
  let urlData = null
  try {
    if (dataParam) {
      urlData = JSON.parse(decodeURIComponent(dataParam))
    }
  } catch (e) {
    console.error('Failed to parse URL data:', e)
  }

  // Use SWR to fetch verification results only if we don't have data and have verificationId
  const { data, error, isLoading } = useSWR(
    verificationId && !urlData && claim ? `/api/verify?verificationId=${verificationId}&claim=${encodeURIComponent(claim)}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000
    }
  )

  // If we only have a claim (no verification ID or data), trigger verification
  const { data: verificationData, error: verificationError, isLoading: isVerifying } = useSWR(
    (!verificationId && !urlData && claim) ? ['/api/verify', claim] : null,
    async ([url, claimText]) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: claimText, public: true })
      })
      if (!response.ok) {
        throw new Error(`Verification failed: ${response.status}`)
      }
      return response.json()
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  )

  // Determine what data to use (priority: URL data > fetched data > verification data)
  const resultData = urlData || data || verificationData
  const isLoadingAny = (isLoading || isVerifying) && !urlData
  const hasError = (error || verificationError) && !urlData

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

  if (isLoadingAny) {
    return (
      <div className="space-y-6">
        <Card className="text-center py-16">
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <div className="absolute inset-0 w-12 h-12 border-4 border-primary/20 rounded-full"></div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-xl font-semibold">Analyzing Your Claim</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Our AI models are cross-referencing multiple sources and analyzing credibility. 
                This process typically takes 10-30 seconds.
              </p>
            </div>

            <div className="max-w-md mx-auto">
              <div className="processing-bar mb-4"></div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  Classification
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse animation-delay-200"></div>
                  Evidence Search
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse animation-delay-400"></div>
                  Credibility Analysis
                </span>
              </div>
            </div>

            <div className="text-sm font-medium text-muted-foreground border rounded-lg p-3 bg-muted/50">
              "{claim}"
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (hasError) {
    return (
      <Card className="text-center py-16">
        <CardContent className="space-y-4">
          <div className="text-destructive">
            <h3 className="text-lg font-semibold mb-2">Verification Failed</h3>
            <p className="text-muted-foreground mb-4">
              {hasError?.message || "Error verifying claim. Please try again."}
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Try Again
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  const handleGenerateTruthCard = async () => {
    const response = await fetch("/api/truth-card", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claim: resultData?.claim, verdict: resultData?.verdict }),
    })
    const result = await response.json()
    alert(result.message)
  }

  if (!resultData) {
    return (
      <Card className="text-center py-16">
        <CardContent>
          <p className="text-muted-foreground mb-4">No verification data available</p>
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
        claim={resultData.claim || claim}
        verdict={resultData.verdict || "unknown"}
        confidence={resultData.confidence || 0}
        explanation={resultData.explanation || ""}
      />

      <div className="flex items-center justify-between mb-6">
        <SourceCredibilityBadge score={resultData.sourceCredibility || 0} />
        <HarmIndexIndicator level={resultData.harmIndex || "low"} />
      </div>

      <EvidenceList evidence={resultData.evidence || []} />

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
