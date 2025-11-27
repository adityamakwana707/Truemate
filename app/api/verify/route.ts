import { NextRequest, NextResponse } from "next/server"
import { getServerAuthSession } from "@/lib/auth"

interface VerificationRequest {
  text?: string
  url?: string
  image?: string
  public?: boolean
}

interface MLModelResponse {
  label: 'True' | 'False' | 'Misleading' | 'Unknown'
  confidence: number
  explanation: string
  evidence_queries?: string[]
  reasoning?: string
  sources?: any[]
}

const ML_SERVICE_BASE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000'
const ML_SERVICE_TIMEOUT = 10000 // 10 seconds

async function callMLService(endpoint: string, data: any): Promise<MLModelResponse> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), ML_SERVICE_TIMEOUT)

  try {
    const response = await fetch(`${ML_SERVICE_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ML_SERVICE_API_KEY || ''}`
      },
      body: JSON.stringify(data),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`ML Service error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const responseText = await response.text()
    try {
      return JSON.parse(responseText)
    } catch (parseError) {
      console.error('Failed to parse ML service response:', responseText)
      throw new Error(`Invalid JSON response from ML service: ${parseError}`)
    }
  } catch (error) {
    clearTimeout(timeoutId)
    console.error('ML Service call failed:', error)
    console.error('Endpoint:', endpoint, 'Data:', data)
    
    // Fallback response when ML service is unavailable
    return {
      label: 'Unknown',
      confidence: 0,
      explanation: 'Unable to verify claim at this time. ML service unavailable.',
      reasoning: 'This is a fallback response. Please try again later.',
      evidence_queries: [],
      sources: []
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerAuthSession()
    
    // Handle both FormData and JSON requests
    let text: string = ''
    let url: string = ''
    let image: string = ''
    let isPublic: boolean = false

    const contentType = request.headers.get('content-type') || ''
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      text = (formData.get('text') as string) || ''
      url = (formData.get('url') as string) || ''
      image = (formData.get('image') as string) || ''
      isPublic = formData.get('public') === 'true'
    } else {
      const body: VerificationRequest = await request.json()
      text = body.text || ''
      url = body.url || ''
      image = body.image || ''
      isPublic = body.public || false
    }

    if (!text && !url && !image) {
      return NextResponse.json(
        { error: 'At least one of text, url, or image must be provided' },
        { status: 400 }
      )
    }

    let claimText = text || ''
    let extractedClaim = ''
    let sources: any[] = []
    let evidence: any[] = []

    // Step 1: Extract claim from URL if provided
    if (url && !text) {
      try {
        const extractResponse = await callMLService('/extract-claim', { url })
        claimText = extractResponse.explanation || url
        extractedClaim = claimText
      } catch (error) {
        console.error('Claim extraction failed:', error)
        claimText = url
      }
    }

    // Step 2: Main misinformation classification
    const classificationResult = await callMLService('/verify', { 
      text: claimText 
    })

    // Step 3: Gather supporting evidence (simplified for debugging)
    let stanceResult = { sources: [], stance: 'unknown' }
    let credibilityResult = { credible_sources: [], avg_credibility: 0 }
    let biasResult = { bias: 'neutral', sentiment: 'neutral', emotion: 'neutral' }

    try {
      stanceResult = await callMLService('/stance-detection', { 
        claim: claimText, 
        evidence_queries: classificationResult.evidence_queries || [] 
      })
    } catch (error) {
      console.error('Stance detection failed:', error)
    }

    try {
      credibilityResult = await callMLService('/source-credibility', { 
        queries: classificationResult.evidence_queries || [] 
      })
    } catch (error) {
      console.error('Credibility analysis failed:', error)
    }

    try {
      biasResult = await callMLService('/bias-sentiment', { 
        text: claimText 
      })
    } catch (error) {
      console.error('Bias sentiment analysis failed:', error)
    }

    // Step 4: Optional image verification if image provided
    let imageAnalysis = null
    if (image) {
      try {
        imageAnalysis = await callMLService('/verify-image', { image })
      } catch (error) {
        console.error('Image verification failed:', error)
        imageAnalysis = { authenticity: 'unknown', confidence: 0 }
      }
    }

    // Step 5: Generate comprehensive explanation
    let explanationResult = {
      explanation: classificationResult.explanation,
      reasoning: classificationResult.reasoning || 'Analysis completed using AI classification models.'
    }

    try {
      const explanationPrompt = {
        claim: claimText,
        verdict: classificationResult.label,
        confidence: classificationResult.confidence,
        evidence: stanceResult.sources || [],
        credibility: credibilityResult.avg_credibility || 0,
        bias: biasResult.bias || 'neutral'
      }
      
      explanationResult = await callMLService('/generate-explanation', explanationPrompt)
    } catch (error) {
      console.error('Explanation generation failed:', error)
    }

    // Step 6: Compile final response
    const verificationId = `ver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const response = {
      verificationId,
      timestamp: new Date().toISOString(),
      claim: claimText,
      extractedClaim: extractedClaim || null,
      verdict: classificationResult.label,
      confidence: Math.round(classificationResult.confidence),
      explanation: explanationResult.explanation || classificationResult.explanation,
      reasoning: explanationResult.reasoning || classificationResult.reasoning,
      evidence: stanceResult.sources || [],
      sourceCredibility: credibilityResult.avg_credibility || 0,
      harmIndex: calculateHarmIndex(classificationResult.label, classificationResult.confidence, biasResult),
      bias: biasResult.bias || 'neutral',
      sentiment: biasResult.sentiment || 'neutral',
      emotion: biasResult.emotion || 'neutral',
      imageAnalysis,
      metadata: {
        processingTimeMs: Date.now() - parseInt(verificationId.split('_')[1]),
        isPublic,
        userId: session?.user?.id || null,
        modelVersions: {
          classifier: '1.0',
          stance: '1.0',
          credibility: '1.0',
          explanation: '1.0'
        }
      }
    }

    // TODO: Store in database if needed
    // await storeVerification(response)

    return NextResponse.json(response)

  } catch (error) {
    console.error('Verification API error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    return NextResponse.json(
      { 
        error: 'Internal server error during verification',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

function calculateHarmIndex(verdict: string, confidence: number, biasResult: any): 'low' | 'medium' | 'high' {
  if (verdict === 'False' && confidence > 80) return 'high'
  if (verdict === 'Misleading' && confidence > 60) return 'medium'
  if (biasResult?.emotion === 'anger' || biasResult?.emotion === 'fear') return 'medium'
  return 'low'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const verificationId = searchParams.get('verificationId')
    const claim = searchParams.get('claim')
    
    // If both verificationId and claim are provided, re-run verification
    if (verificationId && claim) {
      // Re-run the verification process
      const verificationData = {
        id: verificationId,
        text: claim,
        url: '',
        image: '',
        isPublic: false
      }

      // Run all available ML models in parallel
      const [
        classificationResult,
        stanceResult,
        credibilityResult,
        biasResult,
        explanationResult
      ] = await Promise.allSettled([
        callMLService('/verify', { text: claim }),
        callMLService('/stance-detection', { claim: claim, evidence_queries: [] }),
        callMLService('/source-credibility', { queries: [claim] }),
        callMLService('/bias-sentiment', { text: claim }),
        callMLService('/generate-explanation', { claim: claim, verdict: 'Unknown' })
      ])

      // Extract results (with fallbacks for failed calls)
      const classification = classificationResult.status === 'fulfilled' ? classificationResult.value : { label: 'Unknown', confidence: 0, explanation: 'Classification failed' }
      const stance = stanceResult.status === 'fulfilled' ? stanceResult.value : { sources: [], stance: 'unknown' }
      const credibility = credibilityResult.status === 'fulfilled' ? credibilityResult.value : { credible_sources: [], avg_credibility: 0 }
      const bias = biasResult.status === 'fulfilled' ? biasResult.value : { bias: 'neutral', sentiment: 'neutral', emotion: 'neutral' }
      const explanation = explanationResult.status === 'fulfilled' ? explanationResult.value : { explanation: 'No explanation available' }

      // Determine final verdict
      const verdict = classification.label
      const confidence = classification.confidence
      const harmIndex = calculateHarmIndex(verdict, confidence, bias)

      const result = {
        id: verificationId,
        text: claim,
        verdict,
        confidence,
        explanation: classification.explanation || explanation.explanation,
        harmIndex,
        evidence: stance.sources || [],
        sources: credibility.credible_sources || [],
        details: {
          classification,
          stance,
          credibility,
          bias,
          explanation
        },
        timestamp: new Date().toISOString(),
        isPublic: false
      }

      return NextResponse.json(result)
    }
    
    // Default API info response
    return NextResponse.json({
      status: 'ok',
      message: 'TruthMate Verification API',
      endpoints: {
        'POST /api/verify': 'Main verification endpoint',
        'GET /api/verify?verificationId=...&claim=...': 'Get verification results',
        'GET /api/health': 'Health check',
        'POST /api/models/classify': 'Direct classification',
        'POST /api/models/stance': 'Stance detection',
        'POST /api/models/credibility': 'Source credibility'
      }
    })
  } catch (error) {
    console.error('GET /api/verify error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch verification results' },
      { status: 500 }
    )
  }
}