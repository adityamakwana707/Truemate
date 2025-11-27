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

    const { image, image_url } = await request.json()

    if (!image && !image_url) {
      return NextResponse.json(
        { error: 'Either image (base64) or image_url must be provided' },
        { status: 400 }
      )
    }

    // Call ML service for image verification
    const response = await fetch(`${ML_SERVICE_BASE_URL}/verify-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ML_SERVICE_API_KEY || ''}`
      },
      body: JSON.stringify({ image, image_url }),
      signal: AbortSignal.timeout(20000) // Longer timeout for image processing
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
    console.error('Image verification API error:', error)
    return NextResponse.json(
      { 
        authenticity: 'unknown',
        confidence: 0,
        analysis: {
          deepfake_probability: 0,
          manipulation_detected: false,
          ai_generated_probability: 0
        },
        error: 'Image verification service unavailable' 
      },
      { status: 503 }
    )
  }
}