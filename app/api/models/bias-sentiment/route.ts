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

    const { text } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text field is required and must be a string' },
        { status: 400 }
      )
    }

    // Call ML service for bias and sentiment analysis
    const response = await fetch(`${ML_SERVICE_BASE_URL}/bias-sentiment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ML_SERVICE_API_KEY || ''}`
      },
      body: JSON.stringify({ text }),
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
    console.error('Bias sentiment API error:', error)
    return NextResponse.json(
      { 
        bias: 'neutral',
        bias_confidence: 0,
        sentiment: 'neutral', 
        sentiment_confidence: 0,
        emotion: 'neutral',
        emotion_confidence: 0,
        error: 'Bias sentiment service unavailable' 
      },
      { status: 503 }
    )
  }
}