"use client"

import { useSearchParams } from "next/navigation"
import { Suspense, useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Bookmark, Loader2, Brain, CheckCircle, XCircle, AlertTriangle, FileText, ExternalLink, ImageIcon } from "lucide-react"
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
  const isImageAnalysis = searchParams?.get("image") === "true"
  
  // State for managing verification ID and bookmarking
  const [savedVerificationId, setSavedVerificationId] = useState<string | null>(verificationId || null)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isBookmarking, setIsBookmarking] = useState(false)

  // Function to save verification result to user's history (memoized)
  const saveVerificationResult = useCallback(async (data: any) => {
    if (!session?.user?.id || !data || savedVerificationId) return

    try {
      const response = await fetch('/api/verifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claim: claim,
          verdict: data.verdict || data.risk_type || 'unknown',
          confidence: data.confidence || data.safety_score || 0,
          explanation: data.explanation || data.analysis_reason || 'Analysis completed',
          sources: data.sources || [],
          metadata: {
            truthmate_analysis: data.truthmate_os_analysis || false,
            safety_score: data.safety_score,
            credibility_score: data.credibility_score,
            analysis_type: data.truthmate_os_analysis ? 'truthmate' : 'standard'
          }
        })
      })

      if (response.ok) {
        const result = await response.json()
        setSavedVerificationId(result.id)
        console.log('Verification saved to history:', result.id)
      } else {
        throw new Error(`Failed to save verification: ${response.status}`)
      }
    } catch (error) {
      console.error('Error saving verification result:', error)
      throw error
    }
  }, [session?.user?.id, claim, savedVerificationId])

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
    if (resultData && session?.user?.id && !savedVerificationId) {
      // Only save if we don't already have a verification ID
      saveVerificationResult(resultData).catch(err => {
        console.warn('Failed to save verification to history, but continuing with display:', err)
      })
    }
  }, [resultData, session?.user?.id, savedVerificationId])

  // Check if verification is already bookmarked when component loads
  useEffect(() => {
    let isMounted = true
    
    const checkBookmarkStatus = async () => {
      if (!session?.user?.id) return
      
      let targetVerificationId = savedVerificationId
      
      // If we don't have a verification ID but we have a claim, try to find it
      if (!targetVerificationId && claim) {
        try {
          const verifyResponse = await fetch('/api/verifications?search=' + encodeURIComponent(claim))
          if (!isMounted) return
          
          if (verifyResponse.ok) {
            const verifyData = await verifyResponse.json()
            if (verifyData.verifications && verifyData.verifications.length > 0) {
              const matchingVerification = verifyData.verifications.find((v: any) => 
                v.claim.toLowerCase().trim() === claim.toLowerCase().trim()
              )
              if (matchingVerification) {
                targetVerificationId = matchingVerification._id
                if (isMounted) setSavedVerificationId(targetVerificationId)
              }
            }
          }
        } catch (error) {
          console.error('Failed to find verification by claim:', error)
        }
      }
      
      if (!targetVerificationId || !isMounted) return
      
      try {
        const response = await fetch('/api/bookmarks')
        if (!isMounted) return
        
        if (response.ok) {
          const data = await response.json()
          const bookmarks = data.bookmarks || []
          const isAlreadyBookmarked = bookmarks.some((bookmark: any) => 
            bookmark.verificationId?._id === targetVerificationId || 
            bookmark.verificationId === targetVerificationId ||
            bookmark.verificationId?.toString() === targetVerificationId
          )
          if (isMounted) {
            setIsBookmarked(isAlreadyBookmarked)
            console.log('Bookmark status checked:', { targetVerificationId, isAlreadyBookmarked, totalBookmarks: bookmarks.length })
          }
        }
      } catch (error) {
        if (isMounted) console.error('Failed to check bookmark status:', error)
      }
    }

    // Only check bookmark status if we have the necessary data and haven't checked before
    if (session?.user?.id && (savedVerificationId || claim)) {
      checkBookmarkStatus()
    }
    
    return () => {
      isMounted = false
    }
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

  // Image Analysis Results Display
  if (isImageAnalysis && resultData) {
    return (
      <div className="space-y-6">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              New Analysis
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 text-pink-700 border-pink-300">
              🖼️ Deepfake Detection Analysis
            </Badge>
            {session?.user && (
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => toggleBookmark()}
                disabled={isBookmarking}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                {isBookmarking ? 'Saving...' : isBookmarked ? 'Saved' : 'Save'}
              </Button>
            )}
          </div>
        </div>

        {/* Image Analysis Hero Card */}
        <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-pink-900/20 dark:via-purple-900/20 dark:to-indigo-900/20">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-indigo-500/10"></div>
          
          <CardContent className="p-12 relative">
            <div className="text-center space-y-8">
              {/* Image Analysis Header */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-pink-500/20 rounded-full blur-xl scale-150"></div>
                  <div className="relative p-6 bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/50 dark:to-purple-900/50 rounded-full border-4 border-pink-300 dark:border-pink-600">
                    <ImageIcon className="w-8 h-8 text-pink-600" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    DEEPFAKE DETECTION
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Advanced AI-Powered Image Authenticity Analysis
                  </p>
                </div>
              </div>

              {/* Authenticity Verdict */}
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 backdrop-blur-sm border-2">
                  <CardContent className="p-6 text-center">
                    <div className="mb-4">
                      {resultData.deepfake_analysis?.verdict === 'REAL' ? (
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                      ) : resultData.deepfake_analysis?.verdict === 'FAKE/AI' ? (
                        <XCircle className="w-12 h-12 text-red-500 mx-auto" />
                      ) : (
                        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto" />
                      )}
                    </div>
                    <h3 className="text-xl font-bold mb-2">Authenticity</h3>
                    <p className="text-2xl font-bold mb-2">
                      {resultData.deepfake_analysis?.authenticity_rating || 'UNKNOWN'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {resultData.deepfake_analysis?.verdict || 'Analysis unavailable'}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 backdrop-blur-sm border-2">
                  <CardContent className="p-6 text-center">
                    <div className="mb-4">
                      <Brain className="w-12 h-12 text-blue-500 mx-auto" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Confidence</h3>
                    <p className="text-2xl font-bold mb-2">
                      {resultData.deepfake_analysis?.confidence_score || 0}%
                    </p>
                    <Progress 
                      value={resultData.deepfake_analysis?.confidence_score || 0} 
                      className="h-2"
                    />
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 backdrop-blur-sm border-2">
                  <CardContent className="p-6 text-center">
                    <div className="mb-4">
                      {resultData.overall_assessment?.risk_level === 'LOW' ? (
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                      ) : resultData.overall_assessment?.risk_level === 'HIGH' ? (
                        <XCircle className="w-12 h-12 text-red-500 mx-auto" />
                      ) : (
                        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto" />
                      )}
                    </div>
                    <h3 className="text-xl font-bold mb-2">Risk Level</h3>
                    <p className="text-2xl font-bold mb-2">
                      {resultData.overall_assessment?.risk_level || 'MEDIUM'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Risk Assessment
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Analysis Details */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Technical Analysis Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Analysis Summary */}
            <div className="p-6 bg-muted/30 rounded-lg">
              <h3 className="font-semibold mb-3">Analysis Summary</h3>
              <p className="text-muted-foreground">
                {resultData.overall_assessment?.recommendation || 'No recommendation available'}
              </p>
            </div>

            {/* Visual Anomalies */}
            {resultData.deepfake_analysis?.visual_anomalies && resultData.deepfake_analysis.visual_anomalies.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Visual Anomalies Detected</h3>
                <div className="grid gap-2">
                  {resultData.deepfake_analysis.visual_anomalies.map((anomaly: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm">{anomaly}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technical Details */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Image Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Format:</span>
                    <span>{resultData.image_info?.format || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dimensions:</span>
                    <span>{resultData.image_info?.size ? `${resultData.image_info.size[0]} × ${resultData.image_info.size[1]}` : 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mode:</span>
                    <span>{resultData.image_info?.mode || 'Unknown'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Analysis Method</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Method:</span>
                    <span>Hybrid Forensic Analysis</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ELA Analysis:</span>
                    <span>{resultData.deepfake_analysis?.ela_analysis_available ? 'Available' : 'Unavailable'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">AI Model:</span>
                    <span>Gemini Vision</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Explanation */}
            {resultData.deepfake_analysis?.detailed_explanation && (
              <div>
                <h3 className="font-semibold mb-3">Detailed Technical Explanation</h3>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {resultData.deepfake_analysis.detailed_explanation}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
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
                      
                      {/* Website Preview */}
                      {resultData.screenshot_b64 ? (
                        <div className="w-full h-[400px] bg-white border-2 border-gray-300 overflow-hidden relative">
                          {/* Website Info Card */}
                          <div className="absolute top-0 left-0 right-0 bg-gray-800 text-white p-3 z-20">
                            <div className="flex items-center gap-2 text-sm">
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                              <span className="font-mono">{resultData.url}</span>
                              <span className="ml-auto text-xs bg-green-600 px-2 py-1 rounded">
                                🔒 SERVER-SIDE SECURE
                              </span>
                            </div>
                          </div>
                          
                          {/* Screenshot Display */}
                          <div className="w-full h-full pt-12 bg-gray-100 flex items-center justify-center">
                            <img 
                              src={`data:image/png;base64,${resultData.screenshot_b64}`}
                              alt="Secure Website Preview"
                              className="max-w-full max-h-full object-contain cursor-pointer hover:scale-105 transition-transform"
                              onClick={(e) => {
                                e.preventDefault();
                                // Enhanced sandbox interaction - zoom/expand view
                                const img = e.target as HTMLImageElement;
                                if (img.classList.contains('scale-150')) {
                                  img.classList.remove('scale-150');
                                } else {
                                  img.classList.add('scale-150');
                                }
                              }}
                            />
                          </div>
                          
                          {/* Security Indicators */}
                          <div className="absolute bottom-4 right-4 space-y-2">
                            <div className="bg-green-600 text-white px-2 py-1 text-xs font-bold rounded">
                              🔒 SECURE MODE
                            </div>
                            <div className="bg-blue-600 text-white px-2 py-1 text-xs font-bold rounded">
                              📷 SERVER-SIDE
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-[400px] bg-white border-2 border-gray-300 overflow-hidden relative">
                          {/* Website Info Card */}
                          <div className="absolute top-0 left-0 right-0 bg-gray-800 text-white p-3 z-20">
                            <div className="flex items-center gap-2 text-sm">
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                              <span className="font-mono">{resultData.url}</span>
                              <span className="ml-auto text-xs bg-yellow-600 px-2 py-1 rounded">
                                📋 TEXT ANALYSIS
                              </span>
                            </div>
                          </div>
                          
                          {/* Live Preview with iframe (safer approach) */}
                          <div className="w-full h-full pt-12 bg-gray-100 relative">
                            <iframe 
                              src={resultData.url}
                              className="w-full h-full border-none"
                              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                              loading="lazy"
                              title="Website Preview"
                              onError={() => {
                                console.log('Iframe failed to load, showing fallback');
                              }}
                            />
                            
                            {/* Click overlay for security */}
                            <div 
                              className="absolute inset-0 bg-transparent cursor-pointer"
                              onClick={(e) => {
                                e.preventDefault();
                                // Show interaction message instead of redirect
                                const overlay = e.target as HTMLElement;
                                const message = document.createElement('div');
                                message.innerHTML = '🔒 Sandbox Mode Active - Interactions Simulated';
                                message.className = 'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold z-30';
                                overlay.appendChild(message);
                                setTimeout(() => message.remove(), 2000);
                              }}
                              title="Click to interact in sandbox"
                            />
                          </div>
                          
                          {/* Security Indicators */}
                          <div className="absolute bottom-4 right-4 space-y-2">
                            <div className="bg-yellow-600 text-white px-2 py-1 text-xs font-bold rounded">
                              🔒 SANDBOXED
                            </div>
                            <div className="bg-blue-600 text-white px-2 py-1 text-xs font-bold rounded">
                              🌐 LIVE PREVIEW
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



      {/* Modern Verdict Display */}
      <div className="space-y-6">
        {/* Verdict Status Card */}
        <Card className={`border-2 shadow-xl ${
          resultData.verdict === 'TRUE' ? 'border-green-200 bg-green-50/30 dark:bg-green-900/10' : 
          resultData.verdict === 'FALSE' ? 'border-red-200 bg-red-50/30 dark:bg-red-900/10' : 
          'border-yellow-200 bg-yellow-50/30 dark:bg-yellow-900/10'
        }`}>
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                {/* Verdict Icon */}
                <div className={`p-4 rounded-full ${
                  resultData.verdict === 'TRUE' ? 'bg-green-100 dark:bg-green-900/30' : 
                  resultData.verdict === 'FALSE' ? 'bg-red-100 dark:bg-red-900/30' : 
                  'bg-yellow-100 dark:bg-yellow-900/30'
                }`}>
                  {resultData.verdict === 'TRUE' && <CheckCircle className="w-8 h-8 text-green-600" />}
                  {resultData.verdict === 'FALSE' && <XCircle className="w-8 h-8 text-red-600" />}
                  {(resultData.verdict === 'MISLEADING' || resultData.verdict === 'UNKNOWN') && (
                    <AlertTriangle className="w-8 h-8 text-yellow-600" />
                  )}
                </div>
                
                {/* Verdict Text */}
                <div>
                  <h2 className={`text-3xl font-bold ${
                    resultData.verdict === 'TRUE' ? 'text-green-600' : 
                    resultData.verdict === 'FALSE' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {resultData.verdict}
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    Analysis completed with {(resultData.confidence || 0).toFixed(0)}% confidence
                  </p>
                </div>
              </div>
              
              {/* Confidence Score */}
              <div className="text-right">
                <div className="text-4xl font-bold text-primary mb-2">
                  {(resultData.confidence || 0).toFixed(0)}%
                </div>
                <Progress 
                  value={resultData.confidence || 0} 
                  className="w-32 h-3"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Claim Display Card */}
        <Card className="border shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary" />
              Analyzed Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <blockquote className="border-l-4 border-primary pl-6 py-2 bg-muted/30 rounded-r">
              <p className="text-lg italic">"{resultData.claim || claim}"</p>
            </blockquote>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Comprehensive Analysis Section */}
      {resultData.comprehensive_explanation && (
        <Card className="overflow-hidden border-2 shadow-2xl bg-gradient-to-br from-slate-50/50 via-blue-50/30 to-indigo-50/20 dark:from-slate-900/30 dark:via-blue-900/20 dark:to-indigo-900/10">
          {/* Modern Header with Icon */}
          <CardHeader className="bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 border-b-2 border-blue-200/20">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-500/10 rounded-xl border-2 border-blue-300/20">
                <Brain className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  AI Analysis Report
                </CardTitle>
                <p className="text-muted-foreground mt-1">
                  Comprehensive fact-checking with expert-level breakdown
                </p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-8">
            <div className="bg-white/70 dark:bg-slate-900/40 rounded-xl p-8 border border-blue-200/30">
              <div className="prose prose-lg max-w-none dark:prose-invert">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mb-4 text-blue-600 flex items-center gap-2" {...props} />,
                    h2: ({ node, ...props }) => <h2 className="text-xl font-bold mb-3 mt-6 text-blue-600 flex items-center gap-2" {...props} />,
                    h3: ({ node, ...props }) => <h3 className="text-lg font-semibold mb-2 mt-4 text-foreground" {...props} />,
                    p: ({ node, ...props }) => <p className="mb-4 leading-relaxed text-foreground/90" {...props} />,
                    ul: ({ node, ...props }) => <ul className="mb-4 ml-6 space-y-2" {...props} />,
                    li: ({ node, ...props }) => <li className="leading-relaxed text-foreground/90" {...props} />,
                    strong: ({ node, ...props }) => <strong className="font-bold text-blue-600 bg-blue-100/50 dark:bg-blue-900/20 px-1 rounded" {...props} />,
                    blockquote: ({ node, ...props }) => (
                      <blockquote className="border-l-4 border-blue-400 bg-blue-50/50 dark:bg-blue-900/10 pl-4 py-3 italic my-4 rounded-r" {...props} />
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

      {/* Sources & Citations */}
      {resultData.citations && resultData.citations.length > 0 && (
        <Card className="border shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary" />
              Sources & Citations
            </CardTitle>
          </CardHeader>
          <CardContent>
            
            <div className="space-y-4">
              {resultData.citations.map((citation: any, index: number) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h5 className="font-semibold text-lg mb-1">{citation.title}</h5>
                      <p className="text-muted-foreground text-sm">{citation.source}</p>
                    </div>
                    <Badge variant="secondary">{citation.credibility}% credible</Badge>
                  </div>
                  
                  <blockquote className="border-l-2 border-primary pl-3 py-1 bg-muted/20 my-3">
                    <p className="italic text-sm">"{citation.excerpt}"</p>
                  </blockquote>
                  
                  <div className="flex justify-between items-center">
                    <Badge variant="outline">{citation.type}</Badge>
                    {citation.url && (
                      <a 
                        href={citation.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline text-sm"
                      >
                        View Source <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
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
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Verification Result
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Detailed AI-powered analysis of your claim, link, or image.
          </p>
        </div>
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          }
        >
          <ResultsContent />
        </Suspense>
      </main>
    </div>
  )
}