"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, AlertTriangle, HelpCircle, Bookmark, Trash2, ExternalLink } from "lucide-react"
import Link from "next/link"

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

// Mock bookmarked claims
const mockBookmarks = [
  {
    id: "1",
    claim: "Coffee consumption linked to reduced risk of heart disease",
    verdict: "true" as const,
    confidence: 88,
    savedAt: "2024-01-15",
  },
  {
    id: "2",
    claim: "Study finds social media use linked to increased anxiety in teens",
    verdict: "true" as const,
    confidence: 92,
    savedAt: "2024-01-14",
  },
  {
    id: "3",
    claim: "New election law requires voter ID in all states",
    verdict: "false" as const,
    confidence: 97,
    savedAt: "2024-01-13",
  },
]

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState(mockBookmarks)

  const removeBookmark = (id: string) => {
    setBookmarks(bookmarks.filter((b) => b.id !== id))
  }

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
                Save claims from the Explore page to access them later
              </p>
              <Link href="/explore">
                <Button>Explore Claims</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookmarks.map((item) => {
              const config = verdictConfig[item.verdict]
              const Icon = config.icon
              return (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-medium mb-2">{item.claim}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <Badge className={config.className}>
                            <Icon className="w-3 h-3 mr-1" />
                            {config.label}
                          </Badge>
                          <span>Confidence: {item.confidence}%</span>
                          <span>Saved: {item.savedAt}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Link href={`/results?claim=${encodeURIComponent(item.claim)}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive"
                          onClick={() => removeBookmark(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
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
