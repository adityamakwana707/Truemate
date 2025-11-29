"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  Clock,
  Search,
  Bookmark,
  Share2,
  Flag,
  Eye,
  ArrowUpRight,
} from "lucide-react"
import useSWR from "swr"
import Link from "next/link"
import { useSession } from "next-auth/react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function TrendingAnalysis() {
  const { data: trendingData } = useSWR('http://localhost:5000/trending-analysis', fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
  })
  
  const { data: streamStatus } = useSWR('http://localhost:5000/stream-status', fetcher, {
    refreshInterval: 5000, // Refresh every 5 seconds
  })

  if (!trendingData || !streamStatus) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            🤖 AI Trend Detection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Analyzing emerging misinformation patterns...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 mb-6">
      {/* Stream Status */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            📡 Live Stream Monitoring
            <Badge variant={streamStatus.success && streamStatus.monitoring_active ? "default" : "secondary"}>
              {streamStatus.success && streamStatus.monitoring_active ? "ACTIVE" : "STANDBY"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{streamStatus.total_claims || 0}</div>
              <div className="text-xs text-muted-foreground">Total Claims</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{streamStatus.recent_claims_24h || 0}</div>
              <div className="text-xs text-muted-foreground">Last 24h</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {streamStatus.ai_engine_status === 'active' ? 'ON' : 'BASIC'}
              </div>
              <div className="text-xs text-muted-foreground">AI Engine</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">3</div>
              <div className="text-xs text-muted-foreground">RSS Streams</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trending Patterns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            🚨 Emerging Misinformation Patterns
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trendingData.success && trendingData.trending_patterns?.length > 0 ? (
            <div className="space-y-4">
              {trendingData.trending_patterns.map((pattern, index) => (
                <div key={pattern.pattern_id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold">Pattern #{index + 1}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        "{pattern.sample_claim.substring(0, 100)}..."
                      </p>
                    </div>
                    <Badge variant={pattern.risk_level === 'high' ? 'destructive' : 'secondary'}>
                      {pattern.risk_level} RISK
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">{pattern.claim_count}</span>
                      <div className="text-muted-foreground">Similar Claims</div>
                    </div>
                    <div>
                      <span className="font-medium">{pattern.velocity.toFixed(1)}/hr</span>
                      <div className="text-muted-foreground">Velocity</div>
                    </div>
                    <div>
                      <span className="font-medium text-red-500">EMERGING</span>
                      <div className="text-muted-foreground">Status</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No Concerning Trends Detected</h3>
              <p className="text-muted-foreground">
                AI monitoring systems haven't identified any emerging misinformation patterns in the last 24 hours.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

const verdictConfig = {
  true: {
    label: "True",
    icon: CheckCircle,
    className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  },
  false: {
    label: "False",
    icon: XCircle,
    className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  },
  misleading: {
    label: "Misleading",
    icon: AlertTriangle,
    className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
  },
  unknown: {
    label: "Unknown",
    icon: HelpCircle,
    className: "bg-muted text-muted-foreground",
  },
}

interface PublicClaim {
  id: string
  claim: string
  verdict: "true" | "false" | "misleading" | "unknown"
  confidence: number
  timestamp: string
  views: number
  bookmarks: number
  category: string
}

function ClaimCard({ item, isBookmarked, onBookmarkChange }: { 
  item: PublicClaim, 
  isBookmarked: boolean,
  onBookmarkChange: (verificationId: string, bookmarked: boolean) => Promise<void>
}) {
  const { data: session } = useSession()
  const [bookmarked, setBookmarked] = useState(isBookmarked)
  const [isUpdating, setIsUpdating] = useState(false)
  
  const config = verdictConfig[item.verdict] || verdictConfig.unknown
  const Icon = config.icon

  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return "just now"
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  const handleBookmarkToggle = async () => {
    if (!session) {
      // Could show a login prompt here
      return
    }

    setIsUpdating(true)
    try {
      await onBookmarkChange(item.id, !bookmarked)
      setBookmarked(!bookmarked)
    } catch (error) {
      console.error('Failed to update bookmark:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  // Update local state when prop changes (e.g., on initial load)
  useEffect(() => {
    setBookmarked(isBookmarked)
  }, [isBookmarked])

  return (
    <Card className="group hover:border-foreground/20 transition-all">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <Link
              href={`/results?claim=${encodeURIComponent(item.claim)}`}
              className="font-medium hover:underline line-clamp-2 text-base leading-snug group-hover:text-foreground transition-colors"
            >
              {item.claim}
            </Link>
            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeAgo(item.timestamp)}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {item.views.toLocaleString()}
              </span>
              <Badge variant="outline" className="text-xs font-normal">
                {item.category}
              </Badge>
            </div>
          </div>
          <Badge variant="outline" className={`shrink-0 ${config.className}`}>
            <Icon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
        </div>
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-xs text-muted-foreground">
            Confidence: <span className="font-semibold text-foreground">{item.confidence}%</span>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={handleBookmarkToggle}
              disabled={isUpdating || !session}
              title={!session ? "Login to bookmark" : bookmarked ? "Remove bookmark" : "Add bookmark"}
            >
              <Bookmark className={`w-4 h-4 ${bookmarked ? "fill-current text-yellow-500" : ""}`} />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Share2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Flag className="w-4 h-4" />
            </Button>
            <Link href={`/results?claim=${encodeURIComponent(item.claim)}`}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ArrowUpRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ExplorePage() {
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [bookmarkStatuses, setBookmarkStatuses] = useState<Record<string, boolean>>({})
  
  // Build API URL with query parameters
  const apiUrl = `/api/explore?category=${selectedCategory}&search=${encodeURIComponent(searchQuery)}&sort=recent`
  const { data: exploreData } = useSWR(apiUrl, fetcher)
  
  const claims = exploreData?.verifications || []
  const stats = exploreData?.stats || { todayVerifications: 0, misinformationCount: 0, activeUsersCount: 0 }

  // Fetch bookmark statuses when claims change and user is authenticated
  useEffect(() => {
    if (session && claims.length > 0) {
      const verificationIds = claims.map((claim: PublicClaim) => claim.id)
      
      fetch('/api/bookmarks/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ verificationIds })
      })
      .then(res => res.json())
      .then(data => {
        if (data.bookmarked) {
          setBookmarkStatuses(data.bookmarked)
        }
      })
      .catch(error => {
        console.error('Failed to fetch bookmark statuses:', error)
      })
    } else if (!session) {
      setBookmarkStatuses({})
    }
  }, [session, claims])

  const handleBookmarkChange = async (verificationId: string, shouldBookmark: boolean) => {
    if (shouldBookmark) {
      // Add bookmark
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ verificationId })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add bookmark')
      }

      // Update local state
      setBookmarkStatuses(prev => ({ ...prev, [verificationId]: true }))
    } else {
      // Remove bookmark
      const response = await fetch(`/api/bookmarks?verificationId=${verificationId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to remove bookmark')
      }

      // Update local state
      setBookmarkStatuses(prev => ({ ...prev, [verificationId]: false }))
    }
  }

  const categories = ["all", "science", "politics", "health", "technology", "finance"]

  const filteredClaims = claims?.filter((claim) => {
    const matchesSearch = claim.claim.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || claim.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Explore Claims</h1>
          <p className="text-muted-foreground">Discover what others are fact-checking. All searches are anonymous.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search claims..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className="capitalize shrink-0"
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        <Tabs defaultValue="recent">
          <TabsList className="mb-6">
            <TabsTrigger value="recent" className="gap-2">
              <Clock className="w-4 h-4" />
              Recent
            </TabsTrigger>
            <TabsTrigger value="trending" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Trending
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="mt-0">
            <div className="grid gap-4">
              {filteredClaims?.map((item) => (
                <ClaimCard 
                  key={item.id} 
                  item={item} 
                  isBookmarked={bookmarkStatuses[item.id] || false}
                  onBookmarkChange={handleBookmarkChange}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="trending" className="mt-0">
            <TrendingAnalysis />
            <div className="grid gap-4 mt-6">
              {filteredClaims
                ?.sort((a, b) => b.views - a.views)
                .map((item) => (
                  <ClaimCard 
                    key={item.id} 
                    item={item} 
                    isBookmarked={bookmarkStatuses[item.id] || false}
                    onBookmarkChange={handleBookmarkChange}
                  />
                ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="grid sm:grid-cols-3 gap-4 mt-10">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Verified Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.todayVerifications.toLocaleString()}</div>
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Live data from API
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Misinformation Found</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.misinformationCount.toLocaleString()}</div>
              <p className="text-xs text-red-600 mt-1">
                {stats.todayVerifications > 0 ? Math.round((stats.misinformationCount / stats.todayVerifications) * 100) : 0}% of claims flagged
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.activeUsersCount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Fact-checking today</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
