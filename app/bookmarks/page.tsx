"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, AlertTriangle, HelpCircle, Bookmark, Trash2, ExternalLink, Loader2 } from "lucide-react"
import Link from "next/link"
import useSWR, { mutate } from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const verdictConfig = {
  true: {
    label: "True",
    icon: CheckCircle,
    className: "bg-green-600 text-white",
  },
  false: {
    label: "False",
    icon: XCircle,
    className: "bg-red-600 text-white",
  },
  misleading: {
    label: "Misleading",
    icon: AlertTriangle,
    className: "bg-yellow-600 text-white",
  },
  unknown: {
    label: "Unknown",
    icon: HelpCircle,
    className: "bg-gray-500 text-white",
  },
}

export default function BookmarksPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  // Fetch bookmarks data
  const { data: bookmarksData, error, isLoading } = useSWR(
    session ? "/api/bookmarks" : null,
    fetcher
  )

  const handleRemoveBookmark = async (bookmarkId: string) => {
    setDeletingIds(prev => new Set(prev).add(bookmarkId))
    
    try {
      const response = await fetch(`/api/bookmarks?id=${bookmarkId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // Refresh the bookmarks list
        mutate("/api/bookmarks")
      } else {
        console.error('Failed to remove bookmark')
      }
    } catch (error) {
      console.error('Error removing bookmark:', error)
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(bookmarkId)
        return newSet
      })
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </main>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const bookmarks = bookmarksData?.bookmarks || []

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bookmark className="w-6 h-6" />
              Saved Claims
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Your bookmarked fact-checks for future reference</p>
          </div>
          <Badge variant="secondary">{bookmarks.length} saved</Badge>
        </div>

        {bookmarks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bookmark className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No bookmarks yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Save interesting claims while browsing to access them later
              </p>
              <Link href="/dashboard">
                <Button>Start Verifying</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookmarks.map((item: any) => {
              const config = verdictConfig[item.verificationId?.verdict as keyof typeof verdictConfig] || verdictConfig.unknown
              const Icon = config.icon
              return (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium leading-relaxed mb-2 pr-2">{item.verificationId?.claim || item.claim}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <Badge className={config.className}>
                            <Icon className="w-3 h-3 mr-1" />
                            {config.label}
                          </Badge>
                          <span>Confidence: {item.verificationId?.confidence || item.confidence}%</span>
                          <span>Saved: {new Date(item.bookmarkedAt || item.createdAt).toLocaleDateString()}</span>
                        </div>
                        {item.notes && (
                          <p className="text-sm text-muted-foreground mt-2 italic">"{item.notes}"</p>
                        )}
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {item.tags.map((tag: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Link href={`/results?claim=${encodeURIComponent(item.verificationId?.claim || item.claim)}&fromHistory=true`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive"
                          onClick={() => handleRemoveBookmark(item.id)}
                          disabled={deletingIds.has(item.id)}
                        >
                          {deletingIds.has(item.id) ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
