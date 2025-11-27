"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Share2,
  Clock,
  TrendingUp,
  Users,
  Award,
  Send,
  Filter,
} from "lucide-react"

type Discussion = {
  id: string
  claim: string
  verdict: "true" | "false" | "misleading" | "unverified"
  author: string
  timestamp: string
  comments: number
  upvotes: number
  downvotes: number
  tags: string[]
}

const mockDiscussions: Discussion[] = [
  {
    id: "1",
    claim: "New study shows coffee reduces risk of heart disease by 20%",
    verdict: "misleading",
    author: "HealthWatcher",
    timestamp: "2 hours ago",
    comments: 24,
    upvotes: 156,
    downvotes: 12,
    tags: ["health", "science"],
  },
  {
    id: "2",
    claim: "Electric vehicles produce more emissions than gas cars when including battery production",
    verdict: "false",
    author: "EcoFacts",
    timestamp: "5 hours ago",
    comments: 89,
    upvotes: 342,
    downvotes: 45,
    tags: ["environment", "technology"],
  },
  {
    id: "3",
    claim: "AI can now detect cancer with 99% accuracy",
    verdict: "misleading",
    author: "TechReporter",
    timestamp: "1 day ago",
    comments: 156,
    upvotes: 523,
    downvotes: 28,
    tags: ["technology", "health"],
  },
  {
    id: "4",
    claim: "Global temperatures have risen 1.1C since pre-industrial times",
    verdict: "true",
    author: "ClimateCheck",
    timestamp: "2 days ago",
    comments: 203,
    upvotes: 891,
    downvotes: 34,
    tags: ["climate", "science"],
  },
]

const topContributors = [
  { name: "FactFinder", verifications: 1234, accuracy: 98 },
  { name: "TruthSeeker", verifications: 987, accuracy: 96 },
  { name: "ClaimBuster", verifications: 756, accuracy: 97 },
  { name: "VerifyPro", verifications: 654, accuracy: 95 },
  { name: "MythDebunker", verifications: 543, accuracy: 94 },
]

export default function CommunityPage() {
  const [newPost, setNewPost] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case "true":
        return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
      case "false":
        return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
      case "misleading":
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Community</h1>
          <p className="text-muted-foreground">
            Discuss fact-checks, share insights, and collaborate with fellow truth-seekers
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create Post */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Start a Discussion</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Share a claim you'd like the community to discuss..."
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                      + Add Tag
                    </Badge>
                  </div>
                  <Button className="gap-2">
                    <Send className="w-4 h-4" />
                    Post
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Discussions Feed */}
            <Tabs defaultValue="trending">
              <div className="flex items-center justify-between mb-4">
                <TabsList>
                  <TabsTrigger value="trending" className="gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Trending
                  </TabsTrigger>
                  <TabsTrigger value="recent" className="gap-2">
                    <Clock className="w-4 h-4" />
                    Recent
                  </TabsTrigger>
                  <TabsTrigger value="controversial" className="gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Controversial
                  </TabsTrigger>
                </TabsList>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Filter className="w-4 h-4" />
                  Filter
                </Button>
              </div>

              <TabsContent value="trending" className="space-y-4 mt-0">
                {mockDiscussions.map((discussion) => (
                  <Card key={discussion.id} className="hover:border-foreground/20 transition-colors">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <p className="font-medium mb-2">{discussion.claim}</p>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className={getVerdictColor(discussion.verdict)}>
                              {discussion.verdict.toUpperCase()}
                            </Badge>
                            <span>by {discussion.author}</span>
                            <span>{discussion.timestamp}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {discussion.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-4">
                          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                            <ThumbsUp className="w-4 h-4" />
                            {discussion.upvotes}
                          </Button>
                          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                            <ThumbsDown className="w-4 h-4" />
                            {discussion.downvotes}
                          </Button>
                          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                            <MessageSquare className="w-4 h-4" />
                            {discussion.comments}
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="text-muted-foreground">
                            <Share2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-muted-foreground">
                            <Flag className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="recent" className="space-y-4 mt-0">
                {mockDiscussions
                  .slice()
                  .reverse()
                  .map((discussion) => (
                    <Card key={discussion.id} className="hover:border-foreground/20 transition-colors">
                      <CardContent className="pt-6">
                        <p className="font-medium mb-2">{discussion.claim}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline" className={getVerdictColor(discussion.verdict)}>
                            {discussion.verdict.toUpperCase()}
                          </Badge>
                          <span>{discussion.timestamp}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </TabsContent>

              <TabsContent value="controversial" className="space-y-4 mt-0">
                {mockDiscussions
                  .filter((d) => d.downvotes > 20)
                  .map((discussion) => (
                    <Card key={discussion.id} className="hover:border-foreground/20 transition-colors">
                      <CardContent className="pt-6">
                        <p className="font-medium mb-2">{discussion.claim}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline" className={getVerdictColor(discussion.verdict)}>
                            {discussion.verdict.toUpperCase()}
                          </Badge>
                          <span>{discussion.comments} comments</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Search */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Search Discussions</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="Search claims, topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </CardContent>
            </Card>

            {/* Top Contributors */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Top Contributors
                </CardTitle>
                <CardDescription>This month's most active fact-checkers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topContributors.map((contributor, index) => (
                    <div key={contributor.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground w-5">{index + 1}.</span>
                        <div>
                          <p className="font-medium text-sm">{contributor.name}</p>
                          <p className="text-xs text-muted-foreground">{contributor.verifications} verifications</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {contributor.accuracy}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Community Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Community Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Active Members</span>
                    <span className="font-medium">12,456</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Discussions Today</span>
                    <span className="font-medium">234</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Claims Verified</span>
                    <span className="font-medium">89,012</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">Avg Response Time</span>
                    <span className="font-medium">4.2 min</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Popular Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Popular Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {[
                    "politics",
                    "health",
                    "science",
                    "technology",
                    "climate",
                    "economics",
                    "social media",
                    "covid-19",
                  ].map((tag) => (
                    <Badge key={tag} variant="outline" className="cursor-pointer hover:bg-muted">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
