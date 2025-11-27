import { NextRequest, NextResponse } from "next/server"
import { getServerAuthSession } from "@/lib/auth"

const ML_SERVICE_BASE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerAuthSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { claim, verdict, confidence, evidence, credibility, bias } = await request.json()

    if (!claim || !verdict) {
      return NextResponse.json(
        { error: 'Claim and verdict fields are required' },
        { status: 400 }
      )
    }

    // Call ML service for explanation generation
    const response = await fetch(`${ML_SERVICE_BASE_URL}/generate-explanation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ML_SERVICE_API_KEY || ''}`
      },
      body: JSON.stringify({ 
        claim, 
        verdict, 
        confidence: confidence || 0, 
        evidence: evidence || [], 
        credibility: credibility || 0,
        bias: bias || 'neutral'
      }),
      signal: AbortSignal.timeout(15000)
    })

    if (!response.ok) {
      throw new Error(`ML service responded with ${response.status}`)
    }

    const result = await response.json()
    
    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString(),
      userId: session.user?.id
    })

  } catch (error) {
    console.error('Explanation generation API error:', error)
    return NextResponse.json(
      { 
        explanation: `This claim was classified as ${verdict} with ${confidence || 0}% confidence.`,
        reasoning: 'Detailed analysis unavailable due to service issues.',
        error: 'Explanation generation service unavailable' 
      },
      { status: 503 }
    )
  }
}