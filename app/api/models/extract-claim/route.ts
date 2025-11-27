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

    const { url, text } = await request.json()

    if (!url && !text) {
      return NextResponse.json(
        { error: 'Either url or text must be provided' },
        { status: 400 }
      )
    }

    // Call ML service for claim extraction
    const response = await fetch(`${ML_SERVICE_BASE_URL}/extract-claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ML_SERVICE_API_KEY || ''}`
      },
      body: JSON.stringify({ url, text }),
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
    console.error('Claim extraction API error:', error)
    return NextResponse.json(
      { 
        extracted_claim: text || url || '',
        confidence: 0,
        error: 'Claim extraction service unavailable' 
      },
      { status: 503 }
    )
  }
}