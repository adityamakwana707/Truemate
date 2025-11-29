"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { HistoryTable } from "@/components/history-table"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function HistoryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  // Fetch history data
  const { data: historyData, error } = useSWR(
    session ? "/api/history" : null,
    fetcher,
    {
      errorRetryCount: 2,
      errorRetryInterval: 1000,
      onError: (error) => {
        console.warn('History data fetch failed:', error)
      }
    }
  )

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </main>
      </div>
    )
  }

  const stats = historyData?.stats || { total: 0, today: 0 }
  const verifications = historyData?.verifications || []
  
  // Calculate verdict stats
  const verdictCounts = verifications.reduce((acc: any, v: any) => {
    const verdict = v.verdict.toLowerCase()
    acc[verdict] = (acc[verdict] || 0) + 1
    return acc
  }, {})
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Verification History</h1>
          <p className="text-muted-foreground">Your past fact-checks and saved claims</p>
          {historyData?.message && (
            <div className="mt-4 p-3 text-sm bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 rounded">
              {historyData.message}
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="grid sm:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-muted flex items-center justify-center">
                <Clock className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{verdictCounts.true || 0}</p>
                <p className="text-xs text-muted-foreground">True</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/10 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{verdictCounts.false || 0}</p>
                <p className="text-xs text-muted-foreground">False</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{verdictCounts.misleading || 0}</p>
                <p className="text-xs text-muted-foreground">Misleading</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <HistoryTable />
      </main>
    </div>
  )
}
