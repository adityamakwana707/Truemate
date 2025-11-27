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

    const { url, domain, queries } = await request.json()

    if (!url && !domain && !queries) {
      return NextResponse.json(
        { error: 'At least one of url, domain, or queries must be provided' },
        { status: 400 }
      )
    }

    // Call ML service for source credibility
    const response = await fetch(`${ML_SERVICE_BASE_URL}/source-credibility`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ML_SERVICE_API_KEY || ''}`
      },
      body: JSON.stringify({ url, domain, queries }),
      signal: AbortSignal.timeout(10000)
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
    console.error('Source credibility API error:', error)
    return NextResponse.json(
      { 
        credibility_score: 0,
        confidence: 0,
        factors: [],
        error: 'Source credibility service unavailable' 
      },
      { status: 503 }
    )
  }
}