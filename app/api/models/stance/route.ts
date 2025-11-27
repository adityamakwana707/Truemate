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

    const { claim, article, evidence_queries } = await request.json()

    if (!claim || typeof claim !== 'string') {
      return NextResponse.json(
        { error: 'Claim field is required and must be a string' },
        { status: 400 }
      )
    }

    // Call ML service for stance detection
    const response = await fetch(`${ML_SERVICE_BASE_URL}/stance-detection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ML_SERVICE_API_KEY || ''}`
      },
      body: JSON.stringify({ 
        claim, 
        article, 
        evidence_queries: evidence_queries || [] 
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
    console.error('Stance detection API error:', error)
    return NextResponse.json(
      { 
        stance: 'unknown',
        confidence: 0,
        sources: [],
        error: 'Stance detection service unavailable' 
      },
      { status: 503 }
    )
  }
}