"use client"

import { useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Bookmark, Loader2, Brain, CheckCircle, XCircle, AlertTriangle, FileText, ExternalLink } from "lucide-react"
import useSWR from "swr"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function ResultsContent() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const claim = searchParams?.get("claim") || ""
  const verificationId = searchParams?.get("verificationId") || ""
  const dataParam = searchParams?.get("data") || ""
  const fromHistory = searchParams?.get("fromHistory") === "true"
  const isPublicParam = searchParams?.get("isPublic")
  const isPublic = isPublicParam === "true" || isPublicParam === null // Default to true if not specified
  
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isBookmarking, setIsBookmarking] = useState(false)
  const [savedVerificationId, setSavedVerificationId] = useState<string | null>(verificationId || null)

  console.log('ResultsContent - claim:', claim)
  console.log('ResultsContent - verificationId:', verificationId)
  console.log('ResultsContent - dataParam:', dataParam)

  // Try to parse data from URL params first
  let urlData = null
  try {
    if (dataParam) {
      urlData = JSON.parse(decodeURIComponent(dataParam))
      console.log('Parsed URL data:', urlData)
    }
  } catch (e) {
    console.error('Failed to parse URL data:', e)
  }

  // Function to save verification result to database
  const saveVerificationResult = async (data: any) => {
    if (!session?.user?.id || !data) return
    
    try {
      const response = await fetch('/api/verifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          claim: claim,
          claimType: 'text',
          verdict: data.verdict?.toLowerCase() || 'unknown',
          confidence: data.confidence || 0,
          explanation: data.explanation || '',
          reasoning: data.reasoning || '',
          sourceCredibility: data.source_credibility || 0,
          harmIndex: data.harm_index || 'low', // Let API normalize this
          evidence: data.evidence || [],
          category: data.category || 'other',
          isPublic: isPublic,
          metadata: {
            processingTime: data.processing_time,
            aiModel: 'python-server',
            sourceCount: (data.evidence || []).length
          }
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.verification?._id) {
          setSavedVerificationId(result.verification._id)
        }
        console.log('Verification result saved to database')
      }
    } catch (error) {
      console.error('Failed to save verification result:', error)
    }
  }

  // Ultimate working verification service
  const { data: verificationData, error: verificationError, isLoading: isVerifying } = useSWR(
    claim ? `verify-${claim}` : null,
    async () => {
      try {
        console.log('Making verification request for claim:', claim)
        // Use the ultimate working service
        const response = await fetch('http://localhost:5000/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ claim: claim })
        })
        
        if (!response.ok) {
          throw new Error(`Verification failed: ${response.status} ${response.statusText}`)
        }
        
        const result = await response.json()
        console.log('Verification result received:', result)
        return result
      } catch (error) {
        console.error('Verification error:', error)
        throw error
      }
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      errorRetryCount: 2,
      errorRetryInterval: 1000
    }
  )

  // Determine what data to use
  const resultData = urlData || verificationData
  const isLoadingAny = isVerifying && !urlData && !verificationData
  const hasError = verificationError && !urlData

  // Save verification result when data becomes available
  useEffect(() => {
    if (resultData && session?.user?.id) {
      // Don't block UI if saving fails
      saveVerificationResult(resultData).catch(err => {
        console.warn('Failed to save verification to history, but continuing with display:', err)
      })
    }
  }, [resultData, session?.user?.id])

  // Check if verification is already bookmarked when component loads
  useEffect(() => {
    const checkBookmarkStatus = async () => {
      if (!session?.user?.id) return
      
      let targetVerificationId = savedVerificationId
      
      // If we don't have a verification ID but we have a claim, try to find it
      if (!targetVerificationId && claim) {
        try {
          const verifyResponse = await fetch('/api/verifications?search=' + encodeURIComponent(claim))
          if (verifyResponse.ok) {
            const verifyData = await verifyResponse.json()
            if (verifyData.verifications && verifyData.verifications.length > 0) {
              const matchingVerification = verifyData.verifications.find((v: any) => 
                v.claim.toLowerCase().trim() === claim.toLowerCase().trim()
              )
              if (matchingVerification) {
                targetVerificationId = matchingVerification._id
                setSavedVerificationId(targetVerificationId)
              }
            }
          }
        } catch (error) {
          console.error('Failed to find verification by claim:', error)
        }
      }
      
      if (!targetVerificationId) return
      
      try {
        const response = await fetch('/api/bookmarks')
        if (response.ok) {
          const data = await response.json()
          const bookmarks = data.bookmarks || []
          const isAlreadyBookmarked = bookmarks.some((bookmark: any) => 
            bookmark.verificationId?._id === targetVerificationId || 
            bookmark.verificationId === targetVerificationId ||
            bookmark.verificationId?.toString() === targetVerificationId
          )
          setIsBookmarked(isAlreadyBookmarked)
          console.log('Bookmark status checked:', { targetVerificationId, isAlreadyBookmarked, totalBookmarks: bookmarks.length })
        }
      } catch (error) {
        console.error('Failed to check bookmark status:', error)
      }
    }

    checkBookmarkStatus()
  }, [session?.user?.id, savedVerificationId, claim])

  // Handle bookmark functionality
  const toggleBookmark = async () => {
    if (!session?.user?.id || !savedVerificationId) {
      console.warn('Cannot bookmark: missing user session or verification ID')
      return
    }
    
    setIsBookmarking(true)
    try {
      if (isBookmarked) {
        // Remove bookmark
        const response = await fetch(`/api/bookmarks?verificationId=${savedVerificationId}`, {
          method: 'DELETE'
        })
        if (response.ok) {
          setIsBookmarked(false)
          console.log('Bookmark removed successfully')
        } else {
          const errorData = await response.json()
          console.error('Failed to remove bookmark:', errorData)
        }
      } else {
        // Add bookmark
        const response = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            verificationId: savedVerificationId,
            notes: '',
            tags: []
          })
        })
        if (response.ok) {
          setIsBookmarked(true)
          console.log('Bookmark added successfully')
        } else {
          const errorData = await response.json()
          console.error('Failed to add bookmark:', errorData)
        }
      }
    } catch (error) {
      console.error('Bookmark operation failed:', error)
    } finally {
      setIsBookmarking(false)
    }
  }



  console.log('Data status:', {
    urlData: !!urlData,
    verificationData: !!verificationData, 
    isVerifying,
    hasError,
    resultData: !!resultData,
    isLoadingAny
  })

  if (!claim) {
    return (
      <Card className="text-center py-16">
        <CardContent>
          <p className="text-muted-foreground mb-4">No claim provided</p>
          <Link href="/dashboard">
            <Button variant="outline" className="gap-2">
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
            
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Comprehensive Analysis in Progress</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Our system combines advanced ML models with comprehensive fact-checking
                for maximum accuracy and detailed analysis.
              </p>
              <div className="flex flex-col gap-2 max-w-sm mx-auto">
                <Progress value={66} className="h-2" />
                <div className="text-xs text-muted-foreground text-center">
                  Processing with Enhanced Models...
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (hasError) {
    return (
      <Card className="text-center py-16">
        <CardContent>
          <p className="text-destructive mb-4">Analysis failed. Please try again.</p>
          <Link href="/dashboard">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Go to Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  if (!resultData && !isLoadingAny) {
    return (
      <Card className="text-center py-16">
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground mb-4">
              {hasError 
                ? "Analysis service unavailable. Please ensure the ML service is running." 
                : "No analysis data available. Click below to analyze this claim."}
            </p>
            
            {!hasError && claim && (
              <div className="space-y-4">
                <Button 
                  onClick={() => window.location.reload()} 
                  className="gap-2"
                >
                  <Brain className="w-4 h-4" />
                  Analyze Claim
                </Button>
                <p className="text-xs text-muted-foreground">
                  Make sure the ML service is running on localhost:5000
                </p>
              </div>
            )}
            
            <Link href="/dashboard">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            New Search
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          {session?.user?.id && (savedVerificationId || resultData) && (
            <Button 
              variant={isBookmarked ? "default" : "outline"} 
              size="sm" 
              className="gap-2"
              onClick={toggleBookmark}
              disabled={isBookmarking || !savedVerificationId}
            >
              {isBookmarking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
              )}
              {isBookmarked ? 'Saved' : 'Save'}
            </Button>
          )}
        </div>
      </div>

      {/* Hero Verdict Card - Enhanced Design */}
      <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-background via-background to-muted/20">
        <div className={`absolute inset-0 opacity-10 ${
          resultData.verdict === 'TRUE' ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 
          resultData.verdict === 'FALSE' ? 'bg-gradient-to-br from-red-500 to-rose-600' : 
          'bg-gradient-to-br from-yellow-500 to-amber-600'
        }`}></div>
        
        <CardContent className="p-12 relative">
          <div className="text-center space-y-8">
            {/* Enhanced Verdict Icon & Label */}
            <div className="flex flex-col items-center gap-6">
              {resultData.verdict === 'TRUE' && (
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl scale-150"></div>
                  <div className="relative p-6 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/20 rounded-full border-4 border-green-200 dark:border-green-700">
                    <CheckCircle className="w-16 h-16 text-green-600" />
                  </div>
                </div>
              )}
              {resultData.verdict === 'FALSE' && (
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl scale-150"></div>
                  <div className="relative p-6 bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-900/30 dark:to-rose-900/20 rounded-full border-4 border-red-200 dark:border-red-700">
                    <XCircle className="w-16 h-16 text-red-600" />
                  </div>
                </div>
              )}
              {(resultData.verdict === 'MISLEADING' || resultData.verdict === 'UNKNOWN') && (
                <div className="relative">
                  <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-xl scale-150"></div>
                  <div className="relative p-6 bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/20 rounded-full border-4 border-yellow-200 dark:border-yellow-700">
                    <AlertTriangle className="w-16 h-16 text-yellow-600" />
                  </div>
                </div>
              )}
              
              <div className="space-y-4">
                <h1 className="text-6xl font-black tracking-tight">
                  {resultData.verdict === 'TRUE' && (
                    <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      TRUE
                    </span>
                  )}
                  {resultData.verdict === 'FALSE' && (
                    <span className="bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                      FALSE
                    </span>
                  )}
                  {resultData.verdict === 'MISLEADING' && (
                    <span className="bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">
                      MISLEADING
                    </span>
                  )}
                  {resultData.verdict === 'UNKNOWN' && (
                    <span className="bg-gradient-to-r from-gray-600 to-slate-600 bg-clip-text text-transparent">
                      UNKNOWN
                    </span>
                  )}
                </h1>
                
                <div className="flex items-center justify-center gap-4">
                  <div className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    {(resultData.confidence || 0).toFixed(0)}%
                  </div>
                  <div className="text-xl text-muted-foreground font-medium">Confidence</div>
                </div>
                
                {/* Confidence Bar */}
                <div className="w-64 mx-auto">
                  <Progress 
                    value={resultData.confidence || 0} 
                    className={`h-3 ${
                      resultData.verdict === 'TRUE' ? 'text-green-500' :
                      resultData.verdict === 'FALSE' ? 'text-red-500' : 'text-yellow-500'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Enhanced Claim Display */}
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-2xl blur-sm"></div>
                <div className="relative p-8 bg-card/80 backdrop-blur-sm rounded-2xl border-2 border-primary/20 shadow-xl">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-full shrink-0">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-primary mb-2 uppercase tracking-wide">
                        Analyzed Claim
                      </h3>
                      <p className="text-2xl font-semibold leading-relaxed text-foreground">
                        "{resultData.claim || claim}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Comprehensive Analysis Section */}
      {resultData.comprehensive_explanation && (
        <Card className="border-0 shadow-xl bg-gradient-to-br from-card via-card to-muted/10">
          <CardContent className="p-0">
            {/* Header Section with Gradient */}
            <div className="bg-gradient-to-r from-primary/10 via-blue-500/10 to-purple-500/10 p-8 border-b">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-sm"></div>
                  <div className="relative p-4 bg-primary/10 rounded-full border-2 border-primary/20">
                    <Brain className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    Comprehensive Analysis
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    Detailed fact-checking breakdown with expert-level analysis
                  </p>
                </div>
              </div>
            </div>
            
            {/* Content Section */}
            <div className="p-8">
              <div className="prose prose-lg max-w-none dark:prose-invert leading-relaxed">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ node, ...props }) => <h1 className="text-3xl font-bold mb-6 text-primary border-b-2 border-primary/20 pb-2" {...props} />,
                    h2: ({ node, ...props }) => <h2 className="text-2xl font-bold mb-4 mt-8 text-primary flex items-center gap-2" {...props} />,
                    h3: ({ node, ...props }) => <h3 className="text-xl font-semibold mb-3 mt-6 text-foreground" {...props} />,
                    p: ({ node, ...props }) => <p className="mb-6 leading-relaxed text-lg text-foreground/90" {...props} />,
                    ul: ({ node, ...props }) => <ul className="mb-6 ml-8 space-y-3" {...props} />,
                    ol: ({ node, ...props }) => <ol className="mb-6 ml-8 space-y-3" {...props} />,
                    li: ({ node, ...props }) => <li className="leading-relaxed text-foreground/90 marker:text-primary" {...props} />,
                    strong: ({ node, ...props }) => <strong className="font-bold text-primary bg-primary/10 px-1 rounded" {...props} />,
                    em: ({ node, ...props }) => <em className="italic text-primary" {...props} />,
                    blockquote: ({ node, ...props }) => (
                      <blockquote className="border-l-4 border-primary/30 bg-primary/5 pl-6 py-4 italic my-6 rounded-r-lg" {...props} />
                    ),
                  }}
                >
                  {resultData.comprehensive_explanation}
                </ReactMarkdown>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Citations Section */}
      {resultData.citations && resultData.citations.length > 0 && (
        <Card className="border-0 shadow-xl bg-gradient-to-br from-card via-card to-muted/5">
          <CardContent className="p-0">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-purple-500/10 p-6 border-b">
              <h4 className="font-bold text-2xl flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <FileText className="w-6 h-6 text-emerald-600" />
                </div>
                <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                  Sources & Citations
                </span>
              </h4>
              <p className="text-muted-foreground mt-1 ml-11">
                Authoritative sources supporting this analysis
              </p>
            </div>
            
            {/* Citations Grid */}
            <div className="p-6">
              <div className="grid gap-6">
                {resultData.citations.map((citation: any, index: number) => (
                  <div 
                    key={index} 
                    className="group relative overflow-hidden rounded-xl border-2 border-muted/30 hover:border-primary/30 transition-all duration-300 hover:shadow-lg bg-gradient-to-r from-background via-background to-muted/10"
                  >
                    {/* Citation Number Badge */}
                    <div className="absolute top-4 left-4 w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-lg">
                        {citation.id?.replace(/\[|\]/g, '') || (index + 1)}
                      </span>
                    </div>
                    
                    <div className="p-6 pl-20">
                      {/* Citation Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h5 className="font-bold text-xl mb-2 text-foreground group-hover:text-primary transition-colors">
                            {citation.title}
                          </h5>
                          <p className="text-muted-foreground font-medium">
                            {citation.source}
                          </p>
                        </div>
                        
                        {/* Credibility Score */}
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            {citation.credibility}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Credibility
                          </div>
                        </div>
                      </div>
                      
                      {/* Excerpt */}
                      <div className="mb-4 p-4 bg-muted/20 rounded-lg border-l-4 border-primary/30">
                        <p className="text-foreground/90 leading-relaxed italic">
                          "{citation.excerpt}"
                        </p>
                      </div>
                      
                      {/* Metadata & Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge 
                            variant="secondary" 
                            className="bg-primary/10 text-primary border-primary/20 font-semibold"
                          >
                            {citation.type}
                          </Badge>
                          {citation.access_date && (
                            <Badge variant="outline" className="text-xs">
                              {citation.access_date}
                            </Badge>
                          )}
                          {citation.relevance && (
                            <span className="text-xs text-muted-foreground">
                              Relevance: {citation.relevance}%
                            </span>
                          )}
                        </div>
                        
                        {citation.url && (
                          <a 
                            href={citation.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors group/link"
                          >
                            <span className="font-medium">View Source</span>
                            <ExternalLink className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Details Section - Improved Layout */}
      {resultData.enhanced_details && (
        <div className="grid md:grid-cols-2 gap-8">
          {/* Source Analysis */}
          {resultData.enhanced_details.source_analysis && (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-900/10 dark:to-indigo-900/10">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Source Analysis
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {resultData.enhanced_details.source_analysis}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Context & Implications */}
          {resultData.enhanced_details.context_implications && (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50/50 to-pink-50/30 dark:from-purple-900/10 dark:to-pink-900/10">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Brain className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Context & Implications
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {resultData.enhanced_details.context_implications}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Methodology Breakdown */}
          {resultData.enhanced_details.methodology_breakdown && (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50/50 to-teal-50/30 dark:from-emerald-900/10 dark:to-teal-900/10">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Methodology
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {resultData.enhanced_details.methodology_breakdown}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Evidence Assessment */}
          {resultData.enhanced_details.evidence_assessment && (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50/50 to-red-50/30 dark:from-orange-900/10 dark:to-red-900/10">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-3">
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                  </div>
                  <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    Evidence Assessment
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {resultData.enhanced_details.evidence_assessment}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Enhanced Analysis Summary Dashboard */}
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 dark:from-slate-900/50 dark:via-gray-900/50 dark:to-zinc-900/50">
        <CardContent className="p-8">
          <h3 className="text-2xl font-bold mb-8 text-center bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Analysis Summary Dashboard
          </h3>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Confidence Metric */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative bg-card/80 backdrop-blur-sm rounded-xl p-6 border-2 border-blue-200/30 text-center hover:border-blue-400/50 transition-all">
                <div className="text-4xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                  {(resultData.confidence || 0).toFixed(0)}%
                </div>
                <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Confidence
                </div>
                <Progress value={resultData.confidence || 0} className="mt-3 h-2" />
              </div>
            </div>

            {/* Credibility Metric */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative bg-card/80 backdrop-blur-sm rounded-xl p-6 border-2 border-emerald-200/30 text-center hover:border-emerald-400/50 transition-all">
                <div className="text-4xl font-black bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-2">
                  {resultData.credibility_score?.toFixed(0) || 'N/A'}%
                </div>
                <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Credibility
                </div>
                <Progress value={resultData.credibility_score || 0} className="mt-3 h-2" />
              </div>
            </div>

            {/* Harm Index Metric */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative bg-card/80 backdrop-blur-sm rounded-xl p-6 border-2 border-orange-200/30 text-center hover:border-orange-400/50 transition-all">
                <div className="text-4xl font-black bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
                  {resultData.harm_index?.toFixed(0) || 'N/A'}%
                </div>
                <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Harm Index
                </div>
                <Progress value={resultData.harm_index || 0} className="mt-3 h-2" />
              </div>
            </div>

            {/* Processing Time Metric */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative bg-card/80 backdrop-blur-sm rounded-xl p-6 border-2 border-purple-200/30 text-center hover:border-purple-400/50 transition-all">
                <div className="text-4xl font-black bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                  {resultData.processing_time?.toFixed(1) || 'N/A'}s
                </div>
                <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Processing Time
                </div>
                <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full animate-pulse" style={{width: '75%'}}></div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ResultsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        }>
          <ResultsContent />
        </Suspense>
      </main>
    </div>
  )
}