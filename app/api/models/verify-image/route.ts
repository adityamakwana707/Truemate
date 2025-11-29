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

    const contentType = request.headers.get('content-type') || ''
    
    // Handle both FormData (multipart) and JSON (base64) requests
    let formData: FormData | null = null
    
    if (contentType.includes('multipart/form-data')) {
      // Direct FormData upload - pass through to ML service
      formData = await request.formData()
      const imageFile = formData.get('image')
      
      if (!imageFile || !(imageFile instanceof File)) {
        return NextResponse.json(
          { error: 'Image file is required' },
          { status: 400 }
        )
      }
      
      // Create new FormData for ML service
      const mlFormData = new FormData()
      mlFormData.append('image', imageFile)
      
      // Call ML service /analyze-image endpoint with multipart/form-data
      const response = await fetch(`${ML_SERVICE_BASE_URL}/analyze-image`, {
        method: 'POST',
        body: mlFormData,
        signal: AbortSignal.timeout(30000) // 30 seconds for deepfake analysis
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`ML service /analyze-image error: ${response.status} - ${errorText}`)
        throw new Error(`ML service responded with ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      
      return NextResponse.json({
        ...result,
        timestamp: new Date().toISOString(),
        userId: session.user?.id
      })
      
    } else {
      // JSON request with base64 image or image_url
      const { image, image_url } = await request.json()

      if (!image && !image_url) {
        return NextResponse.json(
          { error: 'Either image (base64) or image_url must be provided' },
          { status: 400 }
        )
      }

      // Convert base64 to File if needed
      if (image && image.startsWith('data:image')) {
        try {
          // Extract base64 data and mime type
          const matches = image.match(/^data:image\/(\w+);base64,(.+)$/)
          if (!matches) {
            throw new Error('Invalid base64 image format')
          }
          
          const mimeType = matches[1]
          const base64Data = matches[2]
          const buffer = Buffer.from(base64Data, 'base64')
          
          // Create a File-like object
          const blob = new Blob([buffer], { type: `image/${mimeType}` })
          const file = new File([blob], `image.${mimeType}`, { type: `image/${mimeType}` })
          
          // Create FormData for ML service
          const mlFormData = new FormData()
          mlFormData.append('image', file)
          
          // Call ML service /analyze-image endpoint
          const response = await fetch(`${ML_SERVICE_BASE_URL}/analyze-image`, {
            method: 'POST',
            body: mlFormData,
            signal: AbortSignal.timeout(30000) // 30 seconds for deepfake analysis
          })

          if (!response.ok) {
            const errorText = await response.text()
            console.error(`ML service /analyze-image error: ${response.status} - ${errorText}`)
            throw new Error(`ML service responded with ${response.status}: ${errorText}`)
          }

          const result = await response.json()
          
          return NextResponse.json({
            ...result,
            timestamp: new Date().toISOString(),
            userId: session.user?.id
          })
          
        } catch (conversionError) {
          console.error('Base64 to File conversion error:', conversionError)
          throw new Error(`Failed to process base64 image: ${conversionError}`)
        }
      } else if (image_url) {
        // For image_url, we'd need to fetch it first, but for now return error
        return NextResponse.json(
          { error: 'image_url parameter not yet supported. Please use base64 image or multipart upload.' },
          { status: 400 }
        )
      } else {
        return NextResponse.json(
          { error: 'Invalid image format' },
          { status: 400 }
        )
      }
    }

  } catch (error: any) {
    console.error('Image verification API error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Image verification service unavailable',
        deepfake_analysis: {
          verdict: 'ERROR',
          confidence_score: 0,
          authenticity_rating: 'UNKNOWN',
          error: error.message || 'Service unavailable'
        },
        overall_assessment: {
          authenticity_score: 0,
          risk_level: 'UNKNOWN',
          recommendation: 'Image analysis failed. Please try again or ensure ML service is running.'
        }
      },
      { status: 503 }
    )
  }
}