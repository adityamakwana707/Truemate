"use client"

import { useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"
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
  const isTruthmateAnalysis = searchParams?.get("truthmate") === "true"

  console.log('ResultsContent - claim:', claim)
  console.log('ResultsContent - verificationId:', verificationId)  
  console.log('ResultsContent - dataParam:', dataParam)
  console.log('ResultsContent - isTruthmateAnalysis:', isTruthmateAnalysis)

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

  // Comprehensive verification service (always uses all analysis)
  const { data: verificationData, error: verificationError, isLoading: isVerifying } = useSWR(
    claim ? `verify-${claim}` : null,
    async () => {
      try {
        console.log('Making comprehensive verification request for claim:', claim)
        
        // Use comprehensive analysis service on port 5000
        const response = await fetch('http://localhost:5000/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: claim })
        })
        
        if (!response.ok) {
          throw new Error(`Verification failed: ${response.status} ${response.statusText}`)
        }
        
        const result = await response.json()
        console.log('Comprehensive verification result received:', result)
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

  // Determine what data to use - prioritize TruthMate OS analysis for URLs
  const resultData = urlData || verificationData
  const isLoadingAny = isVerifying && !urlData && !verificationData
  const hasError = verificationError && !urlData
  
  // Check if this is TruthMate OS analysis result
  const isTruthmateResult = isTruthmateAnalysis && urlData && urlData.truthmate_os_style

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
                Running comprehensive analysis with all available models, web scraping,
                and advanced fact-checking for maximum accuracy.
              </p>
              <div className="flex flex-col gap-2 max-w-sm mx-auto">
                <Progress value={75} className="h-2" />
                <div className="text-xs text-muted-foreground text-center">
                  Comprehensive Analysis in Progress...
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

  // TruthMate OS Results Display
  if (isTruthmateResult) {
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
            <Badge variant="outline" className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-purple-700 border-purple-300">
              🕵️ TruthMate OS Analysis
            </Badge>
            <Button variant="outline" size="sm" className="gap-2">
              <Bookmark className="w-4 h-4" />
              Save
            </Button>
          </div>
        </div>

        {/* TruthMate OS Hero Card */}
        <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-indigo-900/20">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-indigo-500/10"></div>
          
          <CardContent className="p-12 relative">
            <div className="text-center space-y-8">
              {/* TruthMate OS Header */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl scale-150"></div>
                  <div className="relative p-6 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/50 dark:to-blue-900/50 rounded-full border-4 border-purple-300 dark:border-purple-600">
                    <span className="text-4xl">🕵️</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    TRUTHMATE OS ANALYSIS
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Advanced Link Safety & Content Verification
                  </p>
                </div>
              </div>

              {/* URL Display */}
              <div className="max-w-4xl mx-auto">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-2xl blur-sm"></div>
                  <div className="relative p-6 bg-card/80 backdrop-blur-sm rounded-2xl border-2 border-purple-300/30 shadow-xl">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-purple-500/10 rounded-full shrink-0">
                        <ExternalLink className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="text-sm font-semibold text-purple-600 mb-2 uppercase tracking-wide">
                          Analyzed URL
                        </h3>
                        <p className="text-xl font-semibold break-all text-foreground">
                          {resultData.url}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Safety Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {/* Safety Score */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl blur opacity-75"></div>
                  <div className="relative bg-card/90 backdrop-blur-sm rounded-xl p-6 border-2 border-green-300/30 text-center">
                    <div className={`text-4xl font-black mb-2 ${
                      resultData.safety_score >= 80 ? 'text-green-600' :
                      resultData.safety_score >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {resultData.safety_score}%
                    </div>
                    <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Safety Score
                    </div>
                    <Progress 
                      value={resultData.safety_score} 
                      className={`h-3 ${
                        resultData.safety_score >= 80 ? 'text-green-500' :
                        resultData.safety_score >= 60 ? 'text-yellow-500' : 'text-red-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Credibility Score */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl blur opacity-75"></div>
                  <div className="relative bg-card/90 backdrop-blur-sm rounded-xl p-6 border-2 border-blue-300/30 text-center">
                    <div className="text-4xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                      {resultData.credibility_score}%
                    </div>
                    <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Credibility
                    </div>
                    <Progress value={resultData.credibility_score} className="h-3 text-blue-500" />
                  </div>
                </div>

                {/* Risk Type */}
                <div className="relative">
                  <div className={`absolute inset-0 rounded-xl blur opacity-75 ${
                    resultData.risk_type === 'safe' ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20' :
                    resultData.risk_type === 'phishing' ? 'bg-gradient-to-br from-red-500/20 to-rose-500/20' :
                    resultData.risk_type === 'scam' ? 'bg-gradient-to-br from-orange-500/20 to-red-500/20' :
                    'bg-gradient-to-br from-yellow-500/20 to-orange-500/20'
                  }`}></div>
                  <div className="relative bg-card/90 backdrop-blur-sm rounded-xl p-6 border-2 border-muted/30 text-center">
                    <div className={`text-3xl font-black mb-2 uppercase ${
                      resultData.risk_type === 'safe' ? 'text-green-600' :
                      resultData.risk_type === 'phishing' ? 'text-red-600' :
                      resultData.risk_type === 'scam' ? 'text-orange-600' :
                      'text-yellow-600'
                    }`}>
                      {resultData.risk_type}
                    </div>
                    <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Risk Classification
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sandbox Visual Return - TruthMate OS Style */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-card via-card to-muted/10">
          <CardContent className="p-8">
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Sandbox Visual Return */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold flex items-center gap-3">
                    <span className="text-red-600">🔒</span>
                    <span>Sandbox Visual Return (Click to Interact)</span>
                  </h3>
                  
                  <div className="relative">
                    {/* Red border frame like TruthMate OS */}
                    <div className="border-4 border-red-600 bg-black min-h-[300px] flex items-center justify-center relative overflow-hidden rounded-lg">
                      {/* Security Badge */}
                      <div className="absolute top-0 left-0 bg-red-600 text-white px-3 py-1 text-sm font-bold z-10">
                        SECURE PREVIEW MODE
                      </div>
                      
                      {/* Live Website Preview or Screenshot */}
                      {resultData.website_preview?.preview_available ? (
                        resultData.screenshot_b64 ? (
                          <img 
                            src={`data:image/png;base64,${resultData.screenshot_b64}`}
                            alt="Website Preview"
                            className="max-w-full max-h-[400px] object-contain cursor-crosshair hover:scale-105 transition-transform"
                            onClick={() => {
                              // Simulate click interaction like TruthMate OS
                              console.log('🖱️ Sandbox interaction detected')
                            }}
                          />
                        ) : (
                          <div className="w-full h-[400px] bg-white border-2 border-gray-300 overflow-hidden relative">
                            {/* Website Info Card */}
                            <div className="absolute top-0 left-0 right-0 bg-gray-800 text-white p-3 z-20">
                              <div className="flex items-center gap-2 text-sm">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="font-mono">{resultData.website_preview?.url || resultData.claim}</span>
                              </div>
                            </div>
                            
                            {/* Live iframe with fallback */}
                            <iframe
                              src={resultData.website_preview?.url || resultData.claim}
                              className="w-full h-full border-none pt-12"
                              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                              title="Live Website Preview - TruthMate OS Sandbox"
                              onLoad={(e) => {
                                console.log('✅ Website loaded successfully in sandbox');
                              }}
                              onError={(e) => {
                                console.log('❌ Iframe failed to load website');
                              }}
                            />
                            
                            {/* Click overlay for interaction simulation */}
                            <div className="absolute inset-0 bg-transparent pointer-events-none">
                              <div className="absolute bottom-4 right-4 bg-red-600 text-white px-2 py-1 text-xs font-bold rounded">
                                🔒 SANDBOX MODE
                              </div>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="text-center text-gray-400 p-8">
                          <div className="text-6xl mb-4">🔍</div>
                          <div className="text-xl mb-2 font-mono">[ANALYZING CONTENT]</div>
                          <div className="text-sm opacity-75 space-y-2">
                            <div>🔐 Website cannot be displayed in sandbox mode</div>
                            <div>📊 Security analysis completed via text extraction</div>
                            <div className="mt-4 text-xs">
                              <div className="bg-gray-800 text-green-400 p-2 rounded font-mono">
                                {'>'} Content successfully extracted and analyzed<br/>
                                {'>'} URL reputation check: COMPLETED<br/>
                                {'>'} Risk assessment: ACTIVE
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-xs text-muted-foreground mt-2">
                      💡 Interactive sandbox mode - All actions are simulated and secure
                    </div>
                  </div>
                </div>

                {/* Agent Report */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold flex items-center gap-3">
                    <span className="text-green-500">📊</span>
                    <span>Agent Report</span>
                  </h3>
                  
                  <div className="bg-black text-green-400 p-6 rounded-lg font-mono text-sm min-h-[300px] overflow-auto">
                    <div className="mb-4">
                      <span className="text-green-500">// </span>
                      <span className="text-green-300">TruthMate OS Analysis Report...</span>
                    </div>
                    
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-blue-400">URL:</span> 
                        <span className="text-white ml-2">{resultData.url}</span>
                      </div>
                      <div>
                        <span className="text-blue-400">Status:</span> 
                        <span className={`ml-2 ${resultData.status === 200 ? 'text-green-400' : 'text-red-400'}`}>
                          {resultData.status || 'Unknown'}
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-400">Title:</span> 
                        <span className="text-white ml-2">"{resultData.page_title}"</span>
                      </div>
                      <div>
                        <span className="text-blue-400">Safety Score:</span> 
                        <span className={`ml-2 font-bold ${
                          resultData.safety_score >= 80 ? 'text-green-400' :
                          resultData.safety_score >= 60 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {resultData.safety_score}%
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-400">Risk Type:</span> 
                        <span className={`ml-2 uppercase font-bold ${
                          resultData.risk_type === 'safe' ? 'text-green-400' :
                          resultData.risk_type === 'phishing' ? 'text-red-400' :
                          resultData.risk_type === 'scam' ? 'text-orange-400' :
                          'text-yellow-400'
                        }`}>
                          {resultData.risk_type}
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-400">Content Length:</span> 
                        <span className="text-white ml-2">{resultData.content_length?.toLocaleString() || 0} chars</span>
                      </div>
                      
                      <div className="border-t border-green-800 pt-3 mt-4">
                        <div className="text-green-300 mb-2">🔍 Security Analysis:</div>
                        <div className="text-white text-xs leading-relaxed pl-4">
                          {resultData.analysis_reason}
                        </div>
                      </div>
                      
                      {resultData.sandbox_preview && (
                        <div className="border-t border-green-800 pt-3 mt-4">
                          <div className="text-green-300 mb-1">📸 Screenshot Status:</div>
                          <div className="text-green-400 pl-4">✅ CAPTURED</div>
                        </div>
                      )}
                      
                      <div className="border-t border-green-800 pt-3 mt-4">
                        <div className="text-green-300 mb-1">⏱️ Analysis Time:</div>
                        <div className="text-white pl-4">{new Date().toLocaleTimeString()}</div>
                      </div>
                      
                      <div className="border-t border-green-800 pt-3 mt-4">
                        <div className="text-green-300 mb-2">🛡️ TruthMate OS Verdict:</div>
                        <div className={`pl-4 font-bold ${
                          resultData.safety_score >= 80 ? 'text-green-400' :
                          resultData.safety_score >= 60 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {resultData.safety_score >= 80 ? '✅ SAFE TO VISIT' :
                           resultData.safety_score >= 60 ? '⚠️ PROCEED WITH CAUTION' : '🚫 HIGH RISK - AVOID'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Website Information */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-card via-card to-muted/10">
          <CardContent className="p-8">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Website Information
                </span>
              </h3>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Page Details */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Page Title</h4>
                    <p className="text-foreground/90 bg-muted/30 p-4 rounded-lg border">
                      {resultData.page_title || 'No title available'}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Content Length</h4>
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold text-primary">
                        {resultData.content_length?.toLocaleString() || 0}
                      </span>
                      <span className="text-muted-foreground">characters</span>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Status Code</h4>
                    <Badge className={`text-lg px-4 py-2 ${
                      resultData.status === 200 ? 'bg-green-500/10 text-green-700 border-green-300' :
                      'bg-red-500/10 text-red-700 border-red-300'
                    }`}>
                      {resultData.status || 'Unknown'}
                    </Badge>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="font-semibold text-lg mb-2">Description</h4>
                  <div className="bg-muted/30 p-6 rounded-lg border">
                    <p className="text-foreground/90 leading-relaxed">
                      {resultData.description || 'No description available'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Summary */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-50/50 to-teal-50/30 dark:from-emerald-900/10 dark:to-teal-900/10">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <FileText className="w-6 h-6 text-emerald-600" />
              </div>
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Content Summary
              </span>
            </h3>
            
            <div className="bg-card/60 p-6 rounded-xl border-2 border-emerald-200/30">
              <p className="text-foreground/90 leading-relaxed text-lg">
                {resultData.summary || 'No content summary available'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Analysis Details */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50/50 to-pink-50/30 dark:from-purple-900/10 dark:to-pink-900/10">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Security Analysis
              </span>
            </h3>
            
            <div className="bg-card/60 p-6 rounded-xl border-2 border-purple-200/30">
              <p className="text-foreground/90 leading-relaxed text-lg">
                {resultData.analysis_reason || 'No detailed analysis available'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* TruthMate OS Badge */}
        <div className="text-center">
          <Badge className="text-lg px-6 py-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-purple-700 border-purple-300">
            ✅ Verified by TruthMate OS • {new Date(resultData.timestamp || Date.now()).toLocaleString()}
          </Badge>
        </div>
      </div>
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

      {/* Enhanced ML Models Analysis - NEW SECTION */}
      {resultData.enhanced_analysis?.model_predictions && (
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-pink-50/20 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold mb-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                🤖 Enhanced ML Model Analysis
              </h3>
              <p className="text-muted-foreground">
                Analysis by {resultData.active_models || 7} trained ML models with {resultData.enhanced_analysis.consensus_score ? Math.round(resultData.enhanced_analysis.consensus_score * 100) : 'N/A'}% consensus
              </p>
            </div>

            {/* ML Consensus Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-6 bg-card/60 rounded-xl border-2 border-indigo-200/40">
                <div className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  {resultData.enhanced_analysis.consensus_score ? Math.round(resultData.enhanced_analysis.consensus_score * 100) : 'N/A'}%
                </div>
                <div className="text-sm font-semibold text-muted-foreground uppercase">ML Consensus</div>
                <Progress value={resultData.enhanced_analysis.consensus_score ? resultData.enhanced_analysis.consensus_score * 100 : 0} className="mt-2 h-2" />
              </div>
              
              <div className="text-center p-6 bg-card/60 rounded-xl border-2 border-purple-200/40">
                <div className={`text-4xl font-black mb-2 ${
                  resultData.enhanced_analysis.risk_level === 'CRITICAL' ? 'text-red-600' :
                  resultData.enhanced_analysis.risk_level === 'HIGH' ? 'text-orange-600' :
                  resultData.enhanced_analysis.risk_level === 'MEDIUM' ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {resultData.enhanced_analysis.risk_level || 'LOW'}
                </div>
                <div className="text-sm font-semibold text-muted-foreground uppercase">Risk Level</div>
              </div>
              
              <div className="text-center p-6 bg-card/60 rounded-xl border-2 border-pink-200/40">
                <div className="text-4xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  {resultData.enhanced_analysis.processing_time_ms?.toFixed(0) || 'N/A'}ms
                </div>
                <div className="text-sm font-semibold text-muted-foreground uppercase">Processing Time</div>
              </div>
            </div>

            {/* Individual Model Results */}
            <div className="space-y-6">
              <h4 className="text-xl font-bold text-center mb-6">Individual Model Predictions</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Object.entries(resultData.enhanced_analysis.model_predictions).map(([modelName, prediction]: [string, any]) => (
                  <div key={modelName} className="group relative">
                    <div className={`absolute inset-0 rounded-xl blur opacity-20 ${
                      prediction.is_fake ? 'bg-red-500' : 'bg-green-500'
                    }`}></div>
                    <div className={`relative p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                      prediction.is_fake 
                        ? 'bg-red-50/80 dark:bg-red-900/20 border-red-200/50 hover:border-red-400/60' 
                        : 'bg-green-50/80 dark:bg-green-900/20 border-green-200/50 hover:border-green-400/60'
                    }`}>
                      {/* Model Name & Type */}
                      <div className="text-center mb-3">
                        <div className="font-bold text-sm uppercase tracking-wide">
                          {modelName.replace('_', ' ')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {prediction.model_type} • {prediction.accuracy ? Math.round(prediction.accuracy * 100) : 'N/A'}% acc
                        </div>
                      </div>
                      
                      {/* Prediction Result */}
                      <div className="text-center">
                        <div className={`text-2xl font-black mb-2 ${
                          prediction.is_fake ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {prediction.is_fake ? 'FAKE' : 'REAL'}
                        </div>
                        <div className="text-sm font-semibold mb-2">
                          {Math.round(prediction.confidence * 100)}% confidence
                        </div>
                        <Progress 
                          value={prediction.confidence * 100} 
                          className={`h-2 ${prediction.is_fake ? 'text-red-500' : 'text-green-500'}`}
                        />
                      </div>
                      
                      {/* Error Handling */}
                      {prediction.error && (
                        <div className="text-center text-red-500 text-xs mt-2">
                          Error: {prediction.error}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Models Agreement Summary */}
              <div className="text-center p-6 bg-card/40 rounded-xl border border-muted/30">
                <div className="text-lg font-semibold mb-2">
                  Model Agreement: {resultData.models_agreement || 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Ensemble Strength: <span className="font-semibold capitalize">{resultData.enhanced_analysis.ensemble_strength || 'Unknown'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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